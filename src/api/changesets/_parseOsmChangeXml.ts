import type {
  OsmChange,
  OsmFeature,
  OsmNode,
  OsmRelation,
  OsmWay,
} from "../../types";
import type { RawOsmChange, RawOsmChangeCategory } from "../_rawResponse";
import { xmlParser } from "../_xml";

function common(feat: NonNullable<RawOsmChangeCategory["way"]>[0]) {
  return {
    changeset: +feat.$.changeset,
    id: +feat.$.id,
    timestamp: feat.$.timestamp,
    uid: +feat.$.uid,
    user: feat.$.user,
    version: +feat.$.version,
    tags: feat.tag
      ? Object.fromEntries(feat.tag.map((tag) => [tag.$.k, tag.$.v]))
      : undefined,
  };
}

const mapSection = (c: RawOsmChangeCategory): OsmFeature[] => {
  const feats: OsmFeature[] = [];

  if (c.node) {
    const nodes: OsmNode[] = c.node.map((n) => ({
      type: "node",
      ...common(n),
      lat: +n.$.lat,
      lon: +n.$.lon,
    }));
    feats.push(...nodes);
  }

  if (c.way) {
    const ways: OsmWay[] = c.way.map((w) => ({
      type: "way",
      ...common(w),
      nodes: w.nd?.map((n) => +n.$.ref) || [],
    }));
    feats.push(...ways);
  }

  if (c.relation) {
    const relations: OsmRelation[] = c.relation.map((r) => ({
      type: "relation",
      ...common(r),
      members:
        r.member?.map((m) => ({
          ref: +m.$.ref,
          role: m.$.role,
          type: m.$.type,
        })) || [],
    }));
    feats.push(...relations);
  }

  return feats;
};

/** @internal */
export function parseOsmChangeJson(raw: RawOsmChange): OsmChange {
  return {
    create: raw.osmChange[0].create?.flatMap(mapSection) || [],
    modify: raw.osmChange[0].modify?.flatMap(mapSection) || [],
    delete: raw.osmChange[0].delete?.flatMap(mapSection) || [],
  };
}

// not marked as internal - this one can be used by consumers
export function parseOsmChangeXml(xml: string): OsmChange {
  const raw = xmlParser.parse(xml);
  return parseOsmChangeJson(raw);
}
