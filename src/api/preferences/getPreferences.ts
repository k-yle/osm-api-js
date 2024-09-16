import type { Tags } from "../../types";
import { osmFetch } from "../_osmFetch";

export async function getPreferences(): Promise<Tags> {
  const raw = await osmFetch<{ preferences: Tags }>(
    "/0.6/user/preferences.json"
  );

  return raw.preferences;
}
