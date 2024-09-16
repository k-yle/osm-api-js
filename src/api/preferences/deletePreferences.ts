import { osmFetch } from "../_osmFetch";

export async function deletePreferences(key: string): Promise<void> {
  await osmFetch<"">(
    `/0.6/user/preferences/${key}.json`,
    {},
    { method: "DELETE" }
  );
}
