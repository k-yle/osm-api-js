import type { OsmMessageWithoutBody } from "../../types";
import { osmFetch } from "../_osmFetch";

export async function listMessages(
  type: "inbox" | "outbox"
): Promise<OsmMessageWithoutBody[]> {
  const raw = await osmFetch<{ messages: OsmMessageWithoutBody[] }>(
    `/0.6/user/messages/${type}.json`
  );

  return raw.messages;
}
