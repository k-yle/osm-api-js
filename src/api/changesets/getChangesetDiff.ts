import { OsmChange } from "../../types";
import { osmFetch } from "../_osmFetch";
import { RawOsmChange } from "../_rawResponse";
import { parseOsmChangeJson } from "./_parseOsmChangeXml";

/** gets the osmChange file for a changeset */
export async function getChangesetDiff(id: number): Promise<OsmChange> {
  const raw = await osmFetch<RawOsmChange>(`/0.6/changeset/${id}/download`);

  return parseOsmChangeJson(raw);
}
