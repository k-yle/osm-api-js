import { osmFetch } from "./_osmFetch";
import { RawCapabilities } from "./_rawResponse";

export type OsmCapabilities = {
  limits: {
    maxArea: number;
    maxNoteArea: number;
    maxTracepointPerPage: number;
    maxWayNodes: number;
    maxChangesetElements: number;
    maxTimeout: number;
  };
  policy: {
    imageryBlacklist: string[];
  };
};

/** This API call provides information about the capabilities and limitations of the current API. */
export async function getCapabilities(): Promise<OsmCapabilities> {
  const raw = await osmFetch<RawCapabilities>("/capabilities");

  const out: OsmCapabilities = {
    limits: {
      maxArea: +raw.osm[0].api[0].area[0].$.maximum,
      maxNoteArea: +raw.osm[0].api[0].note_area[0].$.maximum,
      maxTracepointPerPage: +raw.osm[0].api[0].tracepoints[0].$.per_page,
      maxWayNodes: +raw.osm[0].api[0].waynodes[0].$.maximum,
      maxChangesetElements: +raw.osm[0].api[0].changesets[0].$.maximum_elements,
      maxTimeout: +raw.osm[0].api[0].timeout[0].$.seconds,
    },
    policy: {
      imageryBlacklist: raw.osm[0].policy[0].imagery[0].blacklist.map(
        (item) => item.$.regex
      ),
    },
  };

  return out;
}
