import type {
  OsmChange,
  OsmFeature,
  OsmFeatureType,
  Tags,
  UtilFeatureForType,
} from "../../types";
import { osmFetch } from "../_osmFetch";
import { getFeatures } from "../getFeature";
import { createChangesetMetaXml } from "./_createOsmChangeXml";
import type { UploadOptions } from "./uploadChangeset";

/** @internal */
type Features = {
  [T in OsmFeatureType]?: { [id: number]: UtilFeatureForType<T> };
};

/** @internal */
export function* chunkArray<T>(
  array: T[],
  limit: number
): Generator<T[], void> {
  for (let index = 0; index < array.length; index += limit) {
    yield array.slice(index, index + limit);
  }
}

/**
 * @internal fetches the latest version of every feature from
 * the API. Chunks the features into groups to reduce API requests.
 */
async function fetchChunked(
  toFetch: Pick<OsmFeature, "type" | "id">[],
  onProgress: (total: number) => void
): Promise<Features> {
  // group by type first.
  const grouped: { [T in OsmFeatureType]?: Set<number> } = {};
  for (const { type, id } of toFetch) {
    grouped[type] ||= new Set();
    grouped[type].add(id);
  }

  let totalFetched = 0;

  const fetched: Features = {};
  for (const _type in grouped) {
    const type = <OsmFeatureType>_type;
    const unchunked = grouped[type]!;
    // fetch in chunks of 100
    for (const ids of chunkArray([...unchunked], 100)) {
      console.log(`Fetching ${ids.length} ${type}s...`);
      const features = await getFeatures(type, ids);

      for (const feature of features) {
        fetched[type] ||= {};
        fetched[type][feature.id] = feature;
      }

      totalFetched += features.length;
      onProgress(totalFetched);
    }
  }
  return fetched;
}

function tryAutoResolveConflict<T extends OsmFeature>(
  remote: T,
  local: T
): T | undefined {
  if (remote.visible === false && local.visible === false) {
    // deleted on both the remote and the local. doesn't matter which one we keep.
    return remote;
  }

  if (remote.visible !== local.visible) {
    // deleted by one, but modified by the other.
    // we definitely can't auto-resolve this.
    return undefined;
  }

  const locDiff =
    remote.type === "node" &&
    local.type === "node" &&
    (remote.lat !== local.lat || remote.lon !== local.lon);

  const nodesDiff =
    remote.type === "way" &&
    local.type === "way" &&
    remote.nodes.join(",") !== local.nodes.join(",");

  const membersDiff =
    remote.type === "relation" &&
    local.type === "relation" &&
    JSON.stringify(remote.members) !== JSON.stringify(local.members);

  const intrinsicDiff = locDiff || nodesDiff || membersDiff;
  if (intrinsicDiff) {
    // there is a conflict between intrinsic attributes, we can't
    // auto-resolve this.
    return undefined;
  }

  const tagDiff = JSON.stringify(remote.tags) !== JSON.stringify(local.tags);
  if (tagDiff) {
    // tags are different. since we don't have access to the base version,
    // we can't determine who added which tags. Therefore, we can't
    // intelligently merge the remaining conflicts in this function.
    return undefined;
  }

  // if we get to here, then the two versions are actually identical. So we
  // can safely pick either local or remote.
  return remote;
}

/** @internal */
export async function handleMergeConflict({
  csId,
  csTags: originalCsTags,
  chunk: originalChunk,
  fetchOptions,
  onProgress,
  onAutomaticConflict,
  onManualConflict,
}: {
  csId: number;
  csTags: Tags;
  chunk: OsmChange;
  fetchOptions: RequestInit;
  onProgress: UploadOptions["onProgress"];
  onAutomaticConflict: UploadOptions["onAutomaticConflict"];
  onManualConflict: UploadOptions["onManualConflict"];
}) {
  let csTags = { ...originalCsTags };
  const chunk = structuredClone(originalChunk);

  let didAutoResolve = csTags["merge_conflict_resolved"]
    ?.split(";")
    .includes("automatically");
  let didManualResolve = csTags["merge_conflict_resolved"]
    ?.split(";")
    .includes("manually");

  // anything that was modified or deleting could have caused a conflict,
  // so we need to fetch the latest version for each feature.
  const potentiallyConflicting = [...chunk.modify, ...chunk.delete];

  onProgress?.({
    phase: "merge_conflicts",
    step: 0,
    total: potentiallyConflicting.length * 2,
  });

  const remoteVersions = await fetchChunked(potentiallyConflicting, (count) => {
    onProgress?.({
      phase: "merge_conflicts",
      step: count,
      total: potentiallyConflicting.length * 2,
    });
  });

  // loop through everything in the OsmChange
  let countChecked = 0;
  for (const _action in chunk) {
    const action = <keyof OsmChange>_action;

    // newly created elements can't have conflicts
    if (action === "create") continue;

    for (const [index, local] of chunk[action].entries()) {
      countChecked++;
      onProgress?.({
        phase: "merge_conflicts",
        step: potentiallyConflicting.length + countChecked,
        total: potentiallyConflicting.length * 2,
      });

      const remote = remoteVersions[local.type]?.[local.id];
      // for every updated+deleted feature, check if our local version
      // has the same version as the latest remote version.

      if (!remote) continue; // skip if the API somehow didn't return this feature
      if (remote.version === local.version) continue; // skip if no conflict

      const diffId = `${local.type[0]}${local.id}@(${local.version}…${remote.version})`;

      // try to automatically resolve conflicts:
      const autoMerged = tryAutoResolveConflict(remote, local);

      let merged: { tags?: Tags; merged: OsmFeature };
      if (autoMerged && onAutomaticConflict) {
        // we were able to auto-resolve the conflicts,
        // call the user's onAutomaticConflict callback.
        const result = await onAutomaticConflict?.({
          remote,
          local,
          merged: autoMerged,
        });
        if (!result) {
          throw new Error(
            `A merge conflict occured, but onAutomaticConflict returned false for ${diffId}`
          );
        }

        didAutoResolve = true;
        merged = { ...result, merged: autoMerged };
      } else {
        // else: we were not able to auto-resolve the conflicts, because
        // they are too complicated (OR: because the user didn't specify
        // an onAutomaticConflict callback)
        if (!onManualConflict) {
          throw new Error(
            autoMerged
              ? `A auto-mergable conflict occured for ${diffId}, but neither onAutomaticConflict nor onManualConflict is not defined.`
              : `A complex merge conflict occured for ${diffId}, but onManualConflict is not defined.`
          );
        }

        const result = await onManualConflict?.({ remote, local });
        if (result === false) {
          throw new Error(
            `A merge conflict occured, but onManualConflict returned false for ${diffId}`
          );
        }

        didManualResolve = true;
        merged = result;
      }

      // this code runs regardless of manual or automatic

      if (merged.tags) {
        // the user wants to update the changeset tags
        const originalTags = csTags;
        csTags = merged.tags;

        // if the user forgot to include created_by, add it back.
        // this tag is required.
        csTags["created_by"] ||= originalTags["created_by"];

        // preserve this tag which might have been added earlier in
        // the process. cannot be overriden by users.
        if (originalTags["chunk"]) csTags["chunk"] = originalTags["chunk"];
      }

      // replace this feature in the osmChange with
      // the merged version, and bump the version.
      merged.merged.version = remote.version;
      chunk[action][index] = merged.merged;
    }

    // this tag is always added, consumers can't remove it, similar to `created_by`.
    if (didAutoResolve && didManualResolve) {
      csTags["merge_conflict_resolved"] = "automatically;manually";
    } else if (didAutoResolve) {
      csTags["merge_conflict_resolved"] = "automatically";
    } else if (didManualResolve) {
      csTags["merge_conflict_resolved"] = "manually";
    }
  }

  // update changeset tags to include `merge_conflict_resolved` + any custom tags
  // TODO: what is the API response? does it matter?
  await osmFetch(`/0.6/changeset/${csId}`, undefined, {
    ...fetchOptions,
    method: "PUT",
    body: createChangesetMetaXml(csTags),
    headers: {
      ...fetchOptions.headers,
      "content-type": "application/xml; charset=utf-8",
    },
  });

  return { csTags, chunk };
}
