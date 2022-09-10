export type OsmFeatureType = "node" | "way" | "relation";

/** these attributes exist on nodes, ways, and relations */
export type OsmBaseFeature = {
  type: string;
  changeset: number;
  id: number;

  timestamp: string;
  user: string;
  version: number;
  uid: number;

  tags?: {
    [key: string]: string;
  };

  /** if false, it means the feature has been deleted */
  visible?: false;
};

export type OsmNode = OsmBaseFeature & {
  type: "node";
  lat: number;
  lon: number;
};

export type OsmWay = OsmBaseFeature & {
  type: "way";
  nodes: number[];
};

export type OsmRelation = OsmBaseFeature & {
  type: "relation";
  members: { type: OsmFeatureType; ref: number; role: string }[];
};

export type OsmFeature = OsmNode | OsmWay | OsmRelation;

/** utility to get the type of the feature from its name */
export type UtilFeatureForType<T extends OsmFeatureType> = T extends "node"
  ? OsmNode
  : T extends "way"
  ? OsmWay
  : T extends "relation"
  ? OsmRelation
  : never;
