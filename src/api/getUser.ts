import { OsmOwnUser, OsmUser } from "../types";
import { osmFetch } from "./_osmFetch";

export async function getUser(user: number): Promise<OsmUser>;
export async function getUser(user: "me"): Promise<OsmOwnUser>;

export async function getUser(
  user: number | "me"
): Promise<OsmUser | OsmOwnUser> {
  const raw = await osmFetch<{ user: OsmUser | OsmOwnUser }>(
    `/0.6/user/${user === "me" ? "details" : user}.json`
  );

  return {
    ...raw.user,
    account_created: new Date(raw.user.account_created),
  };
}

export async function getUsers(users: number[]): Promise<OsmUser[]> {
  const raw = await osmFetch<{ users: OsmUser[] }>("/0.6/users", { users });

  return raw.users.map((u) => ({
    ...u,
    account_created: new Date(u.account_created),
  }));
}
