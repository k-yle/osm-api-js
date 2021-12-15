export type OsmUserRole = "moderator";

export type OsmUser = {
  id: number;
  display_name: string;
  account_created: Date;
  description: string;
  contributor_terms: { agreed: boolean; pd: boolean };
  img: { href: string };
  roles: OsmUserRole[];
  changesets: { count: number };
  traces: { count: number };
  blocks: { received: { count: number; active: number } };
};

export type OsmOwnUser = OsmUser & {
  home: { lat: number; lon: number; zoom: number };
  languages: string[];
  messages: {
    received: { count: number; unread: number };
    sent: { count: number };
  };
};
