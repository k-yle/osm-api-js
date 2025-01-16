export type OsmOAuth2Scopes =
  | "consume_messages"
  | "send_messages"
  | "read_prefs"
  | "write_prefs"
  | "write_diary"
  | "write_api"
  | "write_redactions"
  | "read_gpx"
  | "write_gpx"
  | "write_notes";

export type LoginOptions = {
  mode: "redirect" | "popup";
  redirectUrl: string;
  clientId: string;
  scopes: readonly OsmOAuth2Scopes[];
  popupSize?: readonly [width: number, height: number];
  /**
   * @default false
   * If `true`, the login popup/page will:
   * 1. first ask the user to logout of OSM
   * 2. Then ask the user to log back in
   * 3. Then start the OAuth flow
   */
  switchUser?: boolean;
};

/** this is the payload that gets stored in localStorage */
export type LoginData = {
  /** ISO Date */
  issuedAt: string;
  accessToken: string;
  scopes: OsmOAuth2Scopes[];
};

/** @internal */
export type Transaction = {
  state: string;
  pkceVerifier: string;
  options: LoginOptions;
};

/** @internal */
declare global {
  interface Window {
    authComplete?(fullUrl: string): void;
  }
}
