import { createPopup } from "./createPopup";
import { exchangeCode } from "./exchangeCode";
import { getOAuthBaseUrl, getRandomString, sha256 } from "./helpers";
import { LoginOptions, LoginData, Transaction } from "./types";

/**
 * If mode = `redirect`, this function will never resolve, and will
 * redirect to openstreetmap.org instead.
 *
 * If mode = `popup`, this function will resolve once the popup is
 * succesfully closed. It may reject if an error occurs durnig login.
 */
export async function login(options: LoginOptions): Promise<LoginData> {
  if (!options.redirectUrl) {
    throw new Error("You must include the 'redirectUrl' option");
  }
  if (!options.clientId) {
    throw new Error("You must include the 'clientId' option");
  }
  if (!options.scopes) {
    throw new Error("You must include the 'scopes' option");
  }

  const state = getRandomString();
  const pkceVerifier = getRandomString();
  const pkceChallenge = await sha256(pkceVerifier);

  const qs = {
    scope: options.scopes.join(" "),
    include_granted_scopes: "true",
    response_type: "code",
    state,
    redirect_uri: options.redirectUrl,
    client_id: options.clientId,
    code_challenge_method: "S256",
    code_challenge: pkceChallenge,
  };

  const loginUrl = `${getOAuthBaseUrl()}/oauth2/authorize?${new URLSearchParams(
    qs
  ).toString()}`;

  const transaction: Transaction = { state, pkceVerifier, options };

  if (options.mode === "popup") {
    const fullUrl = await createPopup(loginUrl);
    return exchangeCode(fullUrl, transaction);
  }

  if (options.mode === "redirect") {
    localStorage.set("__osmAuthTemp", JSON.stringify(transaction));
    window.location.replace(loginUrl);
    return undefined as never;
  }

  throw new Error("options.mode must be 'popup' or 'redirect'");
}

/**
 * if you used the `redirect` method to login, you need to await this variable
 * before you can safely determine if a user is logged in or not.
 */
export const authReady: Promise<void> = (async () => {
  if (typeof window === "undefined") return; // running in nodejs
  const fullUrl = window.location.href;
  const loginState = localStorage.getItem("__osmAuthTemp");

  if (new URL(fullUrl).searchParams.get("code")) {
    if (window.opener?.authComplete) {
      window.opener.authComplete(fullUrl);
      window.close();
    } else if (loginState) {
      try {
        const transaction: Transaction = JSON.parse(loginState);
        await exchangeCode(fullUrl, transaction);
        localStorage.removeItem("__osmAuthTemp");
      } catch (ex) {
        console.error("OSM Auth Error", ex);
      }
    } else {
      // there is ?code= in the URL, but there is no login in progress...
    }
  }
})();

/** returns the OAuth2 `access_token` if the user is logged in, otherwise it returns `undefined` */
export const getAuthToken = (): string | undefined => {
  try {
    const maybeJson = localStorage.getItem("__osmAuth");
    return maybeJson
      ? (JSON.parse(maybeJson) as LoginData).accessToken
      : undefined;
  } catch {
    return undefined;
  }
};

/** returns `true` if the user is logged in */
export const isLoggedIn = (): boolean => !!getAuthToken();

export function logout() {
  localStorage.removeItem("__osmAuth");
}
