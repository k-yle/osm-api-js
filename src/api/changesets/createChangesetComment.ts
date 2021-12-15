import { osmFetch } from "../_osmFetch";

/** Add a comment to a changeset. The changeset must be closed. */
export async function createChangesetComment(
  changesetId: number,
  commentText: string
): Promise<void> {
  await osmFetch(`/0.6/changeset/${changesetId}/comment`, undefined, {
    method: "POST",
    body: `text=${encodeURIComponent(commentText)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  });
}
