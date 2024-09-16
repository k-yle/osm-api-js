export type OsmOAuth2Scopes =
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
