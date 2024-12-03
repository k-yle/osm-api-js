import { osmFetch } from "../_osmFetch";

export async function subscribeToChangeset(changesetId: number): Promise<void> {
  await osmFetch(
    `/0.6/changeset/${changesetId}/subscribe`,
    {},
    { method: "POST" }
  );
}

export async function unsubscribeFromChangeset(
  changesetId: number
): Promise<void> {
  await osmFetch(
    `/0.6/changeset/${changesetId}/unsubscribe`,
    {},
    { method: "POST" }
  );
}
