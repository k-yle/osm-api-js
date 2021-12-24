import { XMLBuilder } from "fast-xml-parser";
import { OsmChange, OsmFeature } from "../../types";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "$",
  format: true,
  suppressEmptyNode: true,
  // this runs before the other escapes (fast-xml-parser#297)
  attributeValueProcessor: (_key, value) => value.replace(/&/g, "&amp;"),
});

/** @internal */
export function createChangesetMetaXml(tags: Record<string, string>) {
  return builder.build({
    osm: {
      changeset: {
        tag: Object.entries(tags).map(([$k, $v]) => ({ $k, $v })),
      },
    },
  });
}

const createGroup = (csId: number, features: OsmFeature[], isCreate?: true) =>
  features.reduce(
    (ac, f) => {
      const base = {
        $id: f.id,
        $version: isCreate ? 0 : f.version,
        $changeset: csId,
        tag: Object.entries(f.tags || {}).map(([$k, $v]) => ({
          $k,
          $v,
        })),
      };
      switch (f.type) {
        case "node": {
          const feat = { ...base, $lat: f.lat, $lon: f.lon };
          return { ...ac, node: [...ac.node, feat] };
        }
        case "way": {
          const feat = { ...base, nd: f.nodes.map(($ref) => ({ $ref })) };
          return { ...ac, way: [...ac.way, feat] };
        }
        case "relation": {
          const feat = {
            ...base,
            member: f.members.map((m) => ({
              $type: m.type,
              $ref: m.ref,
              $role: m.role,
            })),
          };
          return { ...ac, relation: [...ac.relation, feat] };
        }
        default:
          return ac;
      }
    },
    { node: [] as unknown[], way: [] as unknown[], relation: [] as unknown[] }
  );

// not marked as internal - this one can be used by consumers
export function createOsmChangeXml(csId: number, diff: OsmChange): string {
  return builder.build({
    osmChange: {
      $version: "0.6",
      $generator: "osm-api-js",
      create: [createGroup(csId, diff.create, true)],
      modify: [createGroup(csId, diff.modify)],
      delete: [{ "$if-unused": true, ...createGroup(csId, diff.delete) }],
    },
  });
}
