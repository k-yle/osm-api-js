import type { OsmFeatureType } from "../types";

/** @internal */
export type RawCapabilities = {
  osm: [
    {
      api: [
        {
          version: [{ $: { minimum: string; maximum: string } }];
          area: [{ $: { maximum: string } }];
          note_area: [{ $: { maximum: string } }];
          tracepoints: [{ $: { per_page: string } }];
          waynodes: [{ $: { maximum: string } }];
          changesets: [{ $: { maximum_elements: string } }];
          timeout: [{ $: { seconds: string } }];
          status: [{ $: { database: "online"; api: "online"; gpx: "online" } }];
        },
      ];
      policy: [{ imagery: [{ blacklist: { $: { regex: string } }[] }] }];
    },
  ];
};

/** @internal */
export type RawChangesets = {
  osm: [
    {
      changeset?: {
        $: {
          id: string;
          created_at: string;
          closed_at: string;
          open: string;
          user: string;
          uid: string;
          min_lat: string;
          min_lon: string;
          max_lat: string;
          max_lon: string;
          comments_count: string;
          changes_count: string;
        };
        tag: { $: { k: string; v: string } }[];
        discussion?: [
          {
            comment?: {
              $: { date: string; uid: string; user: string };
              text: [string];
            }[];
          },
        ];
      }[];
    },
  ];
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
