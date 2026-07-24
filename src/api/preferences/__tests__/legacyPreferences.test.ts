import { beforeEach, describe, expect, it, vi } from "vitest";
import { osmFetch } from "../../_osmFetch";
import { deletePreferences } from "../deletePreferences";
import { updatePreferences } from "../updatePreferences";

vi.mock("../../_osmFetch", () => ({
  osmFetch: vi.fn(),
}));

describe("legacy preference APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updatePreferences writes one raw key", async () => {
    vi.mocked(osmFetch).mockResolvedValue("");

    await updatePreferences("my-key", "value", {
      headers: { "X-Test-Header": "token" },
    });

    expect(osmFetch).toHaveBeenCalledWith(
      "/0.6/user/preferences/my-key.json",
      {},
      {
        headers: { "X-Test-Header": "token" },
        method: "PUT",
        body: "value",
      }
    );
  });

  it("deletePreferences deletes one raw key", async () => {
    vi.mocked(osmFetch).mockResolvedValue("");

    await deletePreferences("my-key", {
      headers: { "X-Test-Header": "token" },
    });

    expect(osmFetch).toHaveBeenCalledWith(
      "/0.6/user/preferences/my-key.json",
      {},
      {
        headers: { "X-Test-Header": "token" },
        method: "DELETE",
      }
    );
  });
});
