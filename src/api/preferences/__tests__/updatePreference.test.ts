import { describe, expect, it, vi } from "vitest";
import * as getPreferencesModule from "../getPreferences";
import { updatePreference } from "../updatePreference";

vi.mock("../getPreferences", () => ({
  getPreferences: vi.fn(),
}));

describe("updatePreference", () => {
  it("throws when key contains disallowed character (e.g. /)", async () => {
    await expect(
      updatePreference("key/with/slash", { x: 1 })
    ).rejects.toThrow(/Preference key must not contain.*unsafe in URL path/);
  });

  it("throws when storage auto and key exists as both single and split", async () => {
    vi.mocked(getPreferencesModule.getPreferences).mockResolvedValue({
      P: "single",
      "P:root": "h1",
      "P:h1": "chunk",
    });
    await expect(updatePreference("P", { x: 1 })).rejects.toThrow(
      /exists as both a single key and split storage/
    );
  });
});
