import { getOAuthBaseUrl } from "./helpers";
import type { LoginData, OsmOAuth2Scopes, Transaction } from "./types";

type ExchangeRawResponse =
  | {
      access_token: string;
      created_at: number;
      scope: string;
      token_type: "Bearer";
    }
  | { error_description: string };

/** @interal */
export async function exchangeCode(
  fullUrl: string,
  { options, pkceVerifier, state }: Transaction
): Promise<LoginData> {
  const responseQs = new URL(fullUrl).searchParams;
  const error = responseQs.get("error_description");
  const code = responseQs.get("code");
  const responseState = responseQs.get("state");

  if (error) throw new Error(error);
  if (!code) throw new Error("No code in OAuth response");
  if (!pkceVerifier || !state) throw new Error("No login in progress");
  if (state !== responseState) throw new Error("State Mismatch");

  const qs = {
    grant_type: "authorization_code",
    code,
    redirect_uri: options.redirectUrl,
    client_id: options.clientId,
    code_verifier: pkceVerifier,
  };
  const url = `${getOAuthBaseUrl()}/oauth2/token?${new URLSearchParams(
    qs
  ).toString()}`;
  const request = await fetch(url, {
    method: "POST",
    body: "",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const exchangeResponse: ExchangeRawResponse = await request.json();

  if ("error_description" in exchangeResponse) {
    throw new Error(exchangeResponse.error_description);
  }

  const loginData: LoginData = {
    issuedAt: new Date(exchangeResponse.created_at * 1000).toISOString(),
    accessToken: exchangeResponse.access_token,
    scopes: exchangeResponse.scope.split(" ") as OsmOAuth2Scopes[],
  };
  localStorage.setItem("__osmAuth", JSON.stringify(loginData));

  // At this point, we can consider the login sucessfull
  delete window.authComplete;

  return loginData;
}
