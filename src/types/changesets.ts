import { OsmFeature } from "./features";

export type ChangesetComment = {
  user: string;
  uid: string;
  date: Date;
  text: string;
};

export type Changeset = {
  id: number;
  created_at: Date;
  open: boolean;
  comments_count: number;
  changes_count: number;
  closed_at: Date;
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  uid: number;
  user: string;
  tags: {
    [key: string]: string;
  };
  /** the `discussion` attribute is only included in the `getChangeset` API */
  discussion?: ChangesetComment[];
};

export type OsmChange = {
  create: OsmFeature[];
  modify: OsmFeature[];
  delete: OsmFeature[];
};
