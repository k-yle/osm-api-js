import type { Changeset, ChangesetComment, OsmFeatureType } from "../types";

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
export type RawNotesSearch = {
  features: {
    geometry: {
      type: "Point";
      coordinates: [lng: number, lat: number];
    };
    properties: {
      id: number;
      url: string;
      comment_url: string;
      close_url: string;
      date_created: string;
      status: "open" | "closed";
      comments: [
        {
          date: string;
          uid: number;
          user: string;
          user_url: string;
          action: "opened" | "closed" | "commented" | "reopened";
          text: string;
          html: string;
        },
      ];
    };
  }[];
};

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
