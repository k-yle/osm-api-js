import type { OsmFeature } from "./features";

export type ChangesetComment = {
  id: number;
  visible: boolean;
  user: string;
  // TODO:(semver breaking) change to number
  uid: string;
  // TODO:(semver breaking) change to string
  date: Date;
  text: string;
};

export type Changeset = {
  id: number;
  // TODO:(semver breaking) change to string
  created_at: Date;
  open: boolean;
  comments_count: number;
  changes_count: number;
  /** property only exists if `open=false` */
  // TODO:(semver breaking) mark as optional
  closed_at: Date;
  /** property only exists if `open=false` */
  // TODO:(semver breaking) mark as optional
  min_lat: number;
  /** property only exists if `open=false` */
  // TODO:(semver breaking) mark as optional
  min_lon: number;
  /** property only exists if `open=false` */
  // TODO:(semver breaking) mark as optional
  max_lat: number;
  /** property only exists if `open=false` */
  // TODO:(semver breaking) mark as optional
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
