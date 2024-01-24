import type { OsmChange } from "../../types";
import { osmFetch } from "../_osmFetch";
import {
  createChangesetMetaXml,
  createOsmChangeXml,
} from "./_createOsmChangeXml";

/**
 * uploads a changeset to the OSM API.
 * @returns the changeset number
 */
export async function uploadChangeset(
  tags: { [key: string]: string },
  diff: OsmChange
): Promise<number> {
  const changesetXml = createChangesetMetaXml(tags);

  const csId = +(await osmFetch<string>("/0.6/changeset/create", undefined, {
    method: "PUT",
    body: changesetXml,
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  }));

  const osmChangeXml = createOsmChangeXml(csId, diff);

  await osmFetch(`/0.6/changeset/${csId}/upload`, undefined, {
    method: "POST",
    body: osmChangeXml,
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });

  await osmFetch(`/0.6/changeset/${csId}/close`, undefined, { method: "PUT" });

  return +csId;
}
