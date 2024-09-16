export type OsmNoteComment = {
  date: string;
  uid: number;
  user: string;
  user_url: string;
  action: "opened" | "closed" | "commented" | "reopened";
  text: string;
  html: string;
};

export type OsmNote = {
  location: { lat: number; lng: number };
  id: number;
  status: "open" | "closed";
  date_created: string;
  comments: OsmNoteComment[];
  url: string;
  comment_url: string;
  close_url: string;
};
