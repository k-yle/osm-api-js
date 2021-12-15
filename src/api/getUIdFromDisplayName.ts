import { listChangesets } from "./changesets";

export async function getUIdFromDisplayName(
  displayName: string
): Promise<number> {
  // this is inefficient, but the only way of doing it
  const cs = await listChangesets({ display_name: displayName });

  if (!cs.length) {
    throw new Error(
      "Could not get uid because the user has never edited the map"
    );
  }

  return cs[0].uid;
}
