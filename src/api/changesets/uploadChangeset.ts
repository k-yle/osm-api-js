import type { OsmChange, OsmFeature, OsmFeatureType, Tags } from "../../types";
import { type FetchOptions, osmFetch } from "../_osmFetch";
import { version } from "../../../package.json";
import type { RawUploadResponse } from "../_rawResponse";
import {
  createChangesetMetaXml,
  createOsmChangeXml,
} from "./_createOsmChangeXml";
import { chunkOsmChange, getOsmChangeSize } from "./chunkOsmChange";
import { handleMergeConflict } from "./mergeConflict";

export interface UploadChunkInfo {
  /** the total number of features being uploaded (counting all chunks) */
  featureCount: number;

  /** the index of this changeset (the first is 0) */
  changesetIndex: number;
  /** the number of changesets required for this upload */
  changesetTotal: number;
}

export interface AutoConflictInfo<T extends OsmFeature = OsmFeature> {
  /** the latest version from the user's side (the version that the user tried to upload) */
  local: T;
  /** the latest version on the remote server */
  remote: T;
  /** the result of automatically merging the `local` and `remote` version */
  merged: T;
}

export interface ManualConflictInfo<T extends OsmFeature = OsmFeature> {
  /** the latest version from the user's side (the version that the user tried to upload) */
  local: T;
  /** the latest version on the remote server */
  remote: T;
}

export type UploadPhase = "upload" | "merge_conflicts";

/** Can include multiple changeset IDs if the upload was chunked. */
export interface UploadResult {
  [changesetId: number]: {
    diffResult: {
      [Type in OsmFeatureType]?: {
        [oldId: number]: {
          newId: number;
          newVersion: number;
        };
      };
    };
  };
}

/** @internal */
export function compress(input: string) {
  // check if it's supported
  if (!globalThis.CompressionStream) return undefined;

  const stream = new Response(input).body!.pipeThrough(
    new CompressionStream("gzip")
  );
  return new Response(stream).blob();
}

export interface UploadOptions {
  /**
   * Some changesets are too big to upload, so they have to be
   * split ("chunked") into multiple changesets.
   * When this happens, you can customize the changeset tags for
   * each chunk by returning {@link Tags}.
   */
  onChunk?(info: UploadChunkInfo): Tags;

  /**
   * Optional, if you want status updates during the upload process,
   * this callback is invoked whenever the progress updates.
   */
  onProgress?(progress: {
    phase: UploadPhase;
    step: number;
    total: number;
  }): void;

  /**
   * This callback is invoked if a merge conflict occurs while
   * uploading, and that conflict is simple enough to be
   * automatically resolved this library.
   *
   * The callback is invoked **for every conflicting feature**.
   *
   *  - If there is no callback, `onManualConflict` will be called instead
   *  - If the callback returns `false`, then `onManualConflict` will be called instead
   *  - If the callback returns an object, then the upload continues.
   *    - You can optionally return an object of changeset
   *      `Tags`. If provided, then the changeset tags are updated
   *      to match the tags that you provided.
   */
  onAutomaticConflict?(
    info: AutoConflictInfo
  ): { tags?: Tags } | false | Promise<{ tags?: Tags } | false>;

  /**
   * This callback is invoked if a merge conflict occurs while
   * uploading, and that conflict is too complex to be resolved
   * automatically by this library.
   *
   * The callback is invoked **for every conflicting feature**.
   *
   *  - If there is no callback, then the upload fails.
   *  - If the callback returns `false`, then the upload fails.
   *  - If the callback returns a merged object, then that merged
   *    object is used.
   *    - You can directly return the `local` or `remote` version,
   *      or merge the two yourself and return the merged version.
   *    - You can also optionally return an object of changeset
   *      `Tags`. If provided, then the changeset tags are updated
   *      to match the tags that you provided.
   */
  onManualConflict?(
    info: ManualConflictInfo
  ):
    | { tags?: Tags; merged: OsmFeature }
    | false
    | Promise<{ tags?: Tags; merged: OsmFeature } | false>;

  /**
   * If a merge conflict occurs, this is the number of times that
   * the upload should be retried.
   * @default 5
   */
  maxRetries?: number;

  /** by default, uploads are compressed with gzip. set to `false` to disable */
  disableCompression?: boolean;
}

/**
 * uploads a changeset to the OSM API.
 * @returns the changeset number
 */
export async function uploadChangeset(
  tags: Tags,
  diff: OsmChange,
  options?: FetchOptions & UploadOptions
): Promise<UploadResult> {
  const {
    onChunk,
    onProgress,
    onAutomaticConflict,
    onManualConflict,
    maxRetries = 3,
    disableCompression,
    ...fetchOptions
  } = options || {};

  const chunks = chunkOsmChange(diff);
  const featureCount = getOsmChangeSize(diff);

  const result: UploadResult = {};

  for (const [index, _chunk] of chunks.entries()) {
    let tagsForChunk = tags;

    // if this is a chunk of an enourmous changeset, the tags
    // for each chunk get custom tags
    if (chunks.length > 1) {
      if (onChunk) {
        // there is a custom implementation for tags.
        tagsForChunk = onChunk({
          featureCount,
          changesetIndex: index,
          changesetTotal: chunks.length,
        });
      } else {
        // there is no custom implementation,
        // so add some default tags to the changeset.
        tagsForChunk["chunk"] = `${index + 1}/${chunks.length}`;
      }
    }

    // if the user didn't include a `created_by` tag, we'll add one.
    tagsForChunk["created_by"] ||= `osm-api-js ${version}`;

    onProgress?.({ phase: "upload", step: index, total: chunks.length });

    const csId = +(await osmFetch<string>("/0.6/changeset/create", undefined, {
      ...fetchOptions,
      method: "PUT",
      body: createChangesetMetaXml(tagsForChunk),
      headers: {
        ...fetchOptions.headers,
        "content-type": "application/xml; charset=utf-8",
      },
    }));

    let csTags = tagsForChunk;
    let chunk = _chunk;
    let retryIndex = 0;
    while (true) {
      if (retryIndex++ === maxRetries) {
        throw new Error(
          `Merge conflicts could not be resolved after ${maxRetries} retries`
        );
      }

      onProgress?.({
        phase: "upload",
        step: index + retryIndex / maxRetries,
        total: chunks.length,
      });

      try {
        const osmChangeXml = createOsmChangeXml(csId, chunk);

        const compressed =
          !disableCompression && (await compress(osmChangeXml));

        const idMap = await osmFetch<RawUploadResponse>(
          `/0.6/changeset/${csId}/upload`,
          undefined,
          {
            ...fetchOptions,
            method: "POST",
            body: compressed || osmChangeXml,
            headers: {
              ...fetchOptions.headers,
              ...(compressed && { "Content-Encoding": "gzip" }),
              "content-type": "application/xml; charset=utf-8",
            },
          }
        );

        // convert the XML format into a more concise JSON format
        result[csId] = { diffResult: {} };
        for (const _type in idMap.diffResult[0]) {
          if (_type === "$") continue;
          const type = <OsmFeatureType>_type;
          const items = idMap.diffResult[0][type] || [];
          for (const item of items) {
            result[csId].diffResult[type] ||= {};
            result[csId].diffResult[type][item.$.old_id] = {
              newId: +item.$.new_id,
              newVersion: +item.$.new_version,
            };
          }
        }
        break;
      } catch (error) {
        if (error instanceof Error && error.cause === 409) {
          // There is a merge conflict
          try {
            ({ csTags, chunk } = await handleMergeConflict({
              csId,
              csTags,
              chunk,
              fetchOptions,
              onProgress,
              onAutomaticConflict,
              onManualConflict,
            }));
            // loop again
          } catch (_conflictError) {
            // throw the error from handleMergeConflict linked
            // to the original 409 error from the API.
            const conflictError =
              _conflictError instanceof Error
                ? _conflictError
                : new Error(`${_conflictError}`);
            conflictError.cause = error;
            throw conflictError;
          }
        } else {
          throw error; // any other error
        }
      }
    }

    // if this request fails, the user shouldn't retry the upload, because uploading
    // has already suceeded at this point, we just couldn't close the changeset.
    // See https://github.com/openstreetmap/iD/issues/2667#issuecomment-108068071
    // TODO: handle this better. Could the thrown error have a property to indicate
    // whether at what phase the upload failed?
    await osmFetch(`/0.6/changeset/${csId}/close`, undefined, {
      ...fetchOptions,
      method: "PUT",
    });
  }

  return result;
}
