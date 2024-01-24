import type { Feature, Geometry } from "geojson";
import type { OsmFeatureType } from "./features";
import type { Tags } from "./general";

/**
 * An OsmPatchFeature is a GeoJson feature that is part
 * of an {@link OsmPatch} file.
 */
export type OsmPatchFeature = Feature<
  Geometry,
  Tags & {
    __action?: "edit" | "move" | "delete";
    __members?: { type: OsmFeatureType; ref: number; role: string }[];
  }
>;

/**
 * An OsmPatch file is a GeoJson file with a few extra properties.
 * See https://github.com/osm-nz/linz-address-import/blob/main/SPEC.md
 * for more information.
 */
export type OsmPatch = {
  type: "FeatureCollection";
  features: OsmPatchFeature[];
  __comment?: string;
  size?: "small" | "medium" | "large";
  instructions?: string;
  changesetTags?: Tags;
};
