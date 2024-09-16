import type { OsmMessage } from "../../types";
import { osmFetch } from "../_osmFetch";

export async function deleteMessage(messageId: number): Promise<OsmMessage> {
  const raw = await osmFetch<{ message: OsmMessage }>(
    `/0.6/user/messages/${messageId}.json`,
    {},
    { method: "DELETE" }
  );

  return raw.message;
}
