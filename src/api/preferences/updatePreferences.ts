import { osmFetch } from "../_osmFetch";

export async function updatePreferences(
  key: string,
  value: string
): Promise<void> {
  await osmFetch<"">(
    `/0.6/user/preferences/${key}.json`,
    {},
    { method: "PUT", body: value }
  );
}
