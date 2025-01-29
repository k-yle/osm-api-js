import type { OsmChange, OsmFeature, OsmFeatureType } from "../../types";
import type { ApiCapabilities } from "../getCapabilities";

const ACTIONS = (<const>[
  "create",
  "modify",
  "delete",
]) satisfies (keyof OsmChange)[];

type Action = (typeof ACTIONS)[number];
type Group = `${Action}-${OsmFeatureType}`;

/** to ensure the uploads are valid, we must follow this order */
const UPLOAD_ORDER: Group[] = [
  "create-node",
  "create-way",
  "create-relation",
  "delete-relation",
  "delete-way",
  "delete-node",
  "modify-node",
  "modify-way",
  "modify-relation",
];

const EMPTY_CHANGESET = (): OsmChange => ({
  create: [],
  modify: [],
  delete: [],
});

/** @internal */
export function getOsmChangeSize(osmChange: OsmChange) {
  return (
    osmChange.create.length + osmChange.modify.length + osmChange.delete.length
  );
}

/**
 * If a changeset is too big to upload at once, this function can split
 * the changeset into smaller chunks, which can be uploaded separately.
 *
 * @param capabilities - optional, this data can be fetched from `getApiCapabilities`.
 *                       if not supplied, {@link chunkOsmChange.DEFAULT_LIMIT} is used.
 */
export function chunkOsmChange(
  osmChange: OsmChange,
  capabilities?: ApiCapabilities
): OsmChange[] {
  const max =
    capabilities?.api.changesets.maximum_elements ??
    chunkOsmChange.DEFAULT_LIMIT;

  // abort early if there's nothing to do.
  if (getOsmChangeSize(osmChange) <= max) return [osmChange];

  const grouped: Partial<Record<Group, OsmFeature[]>> = {};

  for (const action of ACTIONS) {
    for (const feature of osmChange[action]) {
      const group: Group = `${action}-${feature.type}`;

      grouped[group] ||= [];
      grouped[group].push(feature);
    }
  }

  const chunks: OsmChange[] = [EMPTY_CHANGESET()];

  function getNext() {
    for (const group of UPLOAD_ORDER) {
      const action = <Action>group.split("-")[0];
      const feature = grouped[group]?.pop();
      if (feature) return { action, feature };
    }
    return undefined;
  }

  let next: ReturnType<typeof getNext>;
  while ((next = getNext())) {
    const head = chunks[0];

    head[next.action].push(next.feature);

    // if the changeset is now too big, create a new chunk
    if (getOsmChangeSize(head) >= max) {
      chunks.unshift(EMPTY_CHANGESET());
    }
  }

  return chunks.reverse();
}

chunkOsmChange.DEFAULT_LIMIT = 10_000;
