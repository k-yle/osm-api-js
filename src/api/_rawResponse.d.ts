import type { FeatureCollection, Point } from "geojson";
import type {
  Changeset,
  ChangesetComment,
  OsmFeatureType,
  OsmNote,
} from "../types";

/** @internal */
export type RawChangeset = Omit<
  Changeset,
  "discussion" | "created_at" | "closed_at"
> & {
  created_at: string;
  closed_at?: string;
  comments?: (Omit<ChangesetComment, "date" | "uid"> & {
    /** ISO Date */
    date: string;
    uid: number;
  })[];
};

/** @internal */
export type RawNotesSearch = FeatureCollection<
  Point,
  Omit<OsmNote, "location">
>;

/** @internal */
type RawFeature = {
  id: string;
  visible: string;
  version: string;
  changeset: string;
  timestamp: string;
  user: string;
  uid: string;
};

/** @internal */
export type RawXmlTags = { tag?: { $: { k: string; v: string } }[] };

/** @internal */
type RawOsmChangeCategory = {
  node?: (RawXmlTags & {
    $: RawFeature & { lat: string; lon: string };
  })[];
  way?: (RawXmlTags & {
    $: RawFeature;
    nd?: { $: { ref: string } }[];
  })[];
  relation?: (RawXmlTags & {
    $: RawFeature;
    member?: { $: { type: OsmFeatureType; ref: string; role: string } }[];
  })[];
};

/** @internal */
export type RawOsmChange = {
  osmChange: [
    {
      create?: RawOsmChangeCategory[];
      modify?: RawOsmChangeCategory[];
      delete?: RawOsmChangeCategory[];
      changeset?: [RawXmlTags];
    },
  ];
};
