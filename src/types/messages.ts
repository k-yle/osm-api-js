export interface OsmMessage {
  id: number;
  from_user_id: number;
  from_display_name: string;
  to_user_id: number;
  to_display_name: string;
  title: string;
  /** ISO Date */
  sent_on: string;
  message_read: boolean;
  deleted: boolean;
  body_format: "text" | "markdown" | "html";
  body: string;
}

export type OsmMessageWithoutBody = Omit<OsmMessage, "body">;
