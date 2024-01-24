import type { BBox, OsmFeature } from "../types";
import { osmFetch } from "./_osmFetch";

/**
 * This command returns:
 * - All nodes that are inside the given bounding box and any relations that reference them.
 * - All ways that reference at least one node that is inside the given bounding box, any relations that reference those ways, and any nodes outside the bounding box that those ways may reference.
 * - All relations that reference one of the nodes, ways or relations included due to the above rules. (Does not apply recursively)
 */
export async function getMapData(bbox: BBox | string): Promise<OsmFeature[]> {
  const raw = await osmFetch<{ elements: OsmFeature[] }>("/0.6/map.json", {
    bbox,
  });

  return raw.elements;
}
