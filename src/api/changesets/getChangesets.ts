import type { BBox, Changeset } from "../../types";
import { osmFetch } from "../_osmFetch";
import type { RawChangeset } from "../_rawResponse";

const mapRawChangeset = ({ comments, ...raw }: RawChangeset): Changeset => ({
  ...raw,
  created_at: new Date(raw.created_at),
  closed_at: raw.closed_at ? new Date(raw.closed_at) : undefined!,

  discussion: comments?.map((comment) => ({
    ...comment,
    date: new Date(comment.date),
    uid: `${comment.uid}`,
  })),
});

export type ListChangesetOptions = {
  /** Find changesets within the given bounding box */
  bbox?: BBox | string;
  /** Limits the number of changesets returned @default 100 */
  limit?: number;
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

  const raw = await osmFetch<{ changesets: RawChangeset[] }>(
    "/0.6/changesets.json",
    {
      ...(only && { [only]: true }),
      ...otherOptions,
    }
  );

  return raw.changesets.map(mapRawChangeset);
}

/** get a single changeset */
export async function getChangeset(
  id: number,
  includeDiscussion = true
): Promise<Changeset> {
  const raw = await osmFetch<{ changeset: RawChangeset }>(
    `/0.6/changeset/${id}.json`,
    includeDiscussion ? { include_discussion: 1 } : {}
  );

  return mapRawChangeset(raw.changeset);
}
