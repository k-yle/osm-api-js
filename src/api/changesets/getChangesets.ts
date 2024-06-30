import type { BBox, Changeset } from "../../types";
import { osmFetch } from "../_osmFetch";
import type { RawChangesets } from "../_rawResponse";

const mapRawChangeset = (
  raw: NonNullable<RawChangesets["osm"][0]["changeset"]>[0]
): Changeset => ({
  id: +raw.$.id,
  created_at: new Date(raw.$.created_at),
  closed_at: new Date(raw.$.closed_at),
  open: raw.$.open === "true",
  comments_count: +raw.$.comments_count,
  changes_count: +raw.$.changes_count,
  min_lat: +raw.$.min_lat,
  min_lon: +raw.$.min_lon,
  max_lat: +raw.$.max_lat,
  max_lon: +raw.$.max_lon,
  uid: +raw.$.uid,
  user: raw.$.user,
  tags: Object.fromEntries(raw.tag.map((tag) => [tag.$.k, tag.$.v])),
  discussion: raw.discussion?.[0].comment?.map((comment) => ({
    date: new Date(comment.$.date),
    user: comment.$.user,
    uid: comment.$.uid,
    text: comment.text[0],
  })),
});

export type ListChangesetOptions = {
  /** Find changesets within the given bounding box */
  bbox?: BBox | string;
  /** if specified, only opened or closed changesets will be returned */
  only?: "opened" | "closed";
  /** Find changesets by the user. You cannot supply both `user` and `display_name` */
  user?: number;
  /** Find changesets by the user. You cannot supply both `user` and `display_name` */
  display_name?: string;
  /**
   * You can either:
   *  - specify a single ISO Date, to find changesets closed after that date
   *  - or, specify a date range to find changesets that were closed after
   *    `start` and created before `end`. In other words, any changesets that
   *    were open at some time during the given time range `start` to `end`.
   */
  time?: string | [start: string, end: string];
  /** Finds changesets with the specified ids */
  changesets?: number[];
};

/**
 * get a list of changesets based on the query. You must supply one of:
 * `bbox`, `user`, `display_name`, or `changesets`.
 *
 * If multiple queries are given, the result will be those which match
 * **all** of the requirements.
 *
 * Returns at most 100 changesets.
 */
export async function listChangesets(
  options: ListChangesetOptions
): Promise<Changeset[]> {
  const { only, ...otherOptions } = options;

  const raw = await osmFetch<RawChangesets>("/0.6/changesets", {
    ...(only && { [only]: true }),
    ...otherOptions,
  });

  return raw.osm[0].changeset?.map(mapRawChangeset) || [];
}

/** get a single changeset */
export async function getChangeset(
  id: number,
  includeDiscussion = true
): Promise<Changeset> {
  const raw = await osmFetch<RawChangesets>(
    `/0.6/changeset/${id}`,
    includeDiscussion ? { include_discussion: 1 } : {}
  );

  return raw.osm[0].changeset!.map(mapRawChangeset)[0];
}
