import type { OsmMessage } from "../../types";
import { osmFetch } from "../_osmFetch";

export async function updateMessageReadStatus(
  messageId: number,
  isRead: boolean
): Promise<OsmMessage> {
  const raw = await osmFetch<{ message: OsmMessage }>(
    `/0.6/user/messages/${messageId}.json`,
    { read_status: isRead },
    { method: "POST" }
  );

  return raw.message;
}
