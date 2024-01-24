import type {
  OsmFeature,
  OsmFeatureType,
  OsmRelation,
  OsmWay,
  UtilFeatureForType,
} from "../types";
import { osmFetch } from "./_osmFetch";

/**
 * Gets infomation about a node, way, or relation.
 *
 * @param full if true, the members of the relation and the nodes of any ways
 *             will be returned. This option has no effect for nodes
 *
 * @returns an array, which will only have one item unless you specify `full=true`
 */
export async function getFeature<T extends OsmFeatureType>(
  type: T,
  id: number,
  full?: false
): Promise<[UtilFeatureForType<T>]>;

/**
 * Gets infomation about a node, way, or relation.
 *
 * @param full if true, the members of the relation and the nodes of any ways
 *             will be returned. This option has no effect for nodes
 *
 * @returns an array, which will only have one item unless you specify `full=true`
 */
export async function getFeature(
  type: OsmFeatureType,
  id: number,
  full: true
): Promise<OsmFeature[]>;

export async function getFeature(
  type: OsmFeatureType,
  id: number,
  full?: boolean
): Promise<OsmFeature[]> {
  const suffix = full && type !== "node" ? "/full" : "";
  const raw = await osmFetch<{ elements: OsmFeature[] }>(
    `/0.6/${type}/${id}${suffix}.json`
  );

  return raw.elements;
}

/**
 * Gets infomation about **multiple** nodes, ways, or relations.
 * The IDs can be numbers, or a number plus a version (e.g. `123456789v2`)
 */
export async function getFeatures<T extends OsmFeatureType>(
  type: T,
  ids: (number | string)[]
): Promise<UtilFeatureForType<T>[]> {
  const raw = await osmFetch<{ elements: UtilFeatureForType<T>[] }>(
    `/0.6/${type}s.json?${type}s=${ids.join(",")}`
  );
  return raw.elements;
}

/**
 * Similar to `getFeature()`, except that this fetched **the specified version**
 * of the node, way, or relation.
 *
 * Unlike `getFeature()`, the `full` option is not supported.
 */
export async function getFeatureAtVersion<T extends OsmFeatureType>(
  type: T,
  id: number,
  version: number
): Promise<UtilFeatureForType<T>> {
  const raw = await osmFetch<{ elements: [UtilFeatureForType<T>] }>(
    `/0.6/${type}/${id}/${version}.json`
  );

  return raw.elements[0];
}

/**
 * Similar as `getFeature()`, except that this fetches **all versions**
 * of the node, way, or relation.
 * Unlike `getFeature()`, the `full` option is not supported.
 */
export async function getFeatureHistory<T extends OsmFeatureType>(
  type: T,
  id: number
): Promise<UtilFeatureForType<T>[]> {
  const raw = await osmFetch<{ elements: UtilFeatureForType<T>[] }>(
    `/0.6/${type}/${id}/history.json`
  );

  return raw.elements;
}

/** gets a list of ways that a node belongs to */
export async function getWaysForNode(nodeId: number): Promise<OsmWay[]> {
  const raw = await osmFetch<{ elements: OsmWay[] }>(
    `/0.6/node/${nodeId}/ways.json`
  );
  return raw.elements;
}

/** gets a list of relations that a node, way, or relation belongs to */
export async function getRelationsForElement(
  type: OsmFeatureType,
  id: number
): Promise<OsmRelation[]> {
  const raw = await osmFetch<{ elements: OsmRelation[] }>(
    `/0.6/${type}/${id}/relations.json`
  );
  return raw.elements;
}
