import { beforeEach, describe, expect, it, vi } from "vitest";
import { deletePreferences } from "../deletePreferences";
import * as getPreferencesModule from "../getPreferences";
import { updatePreferences } from "../updatePreferences";
import { updatePreference } from "../updatePreference";

vi.mock("../getPreferences", () => ({
  getPreferences: vi.fn(),
}));
vi.mock("../updatePreferences", () => ({
  updatePreferences: vi.fn(),
}));
vi.mock("../deletePreferences", () => ({
  deletePreferences: vi.fn(),
}));

describe("updatePreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when key contains disallowed character (e.g. /)", async () => {
    await expect(updatePreference("key/with/slash", { x: 1 })).rejects.toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
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

  it("auto writes single and removes previous split storage", async () => {
    vi.mocked(getPreferencesModule.getPreferences).mockResolvedValue({
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "old chunk",
    });
    vi.mocked(updatePreferences).mockResolvedValue();
    vi.mocked(deletePreferences).mockResolvedValue();

    await updatePreference("P", { x: 1 }, { storage: "auto" });

    expect(updatePreferences).toHaveBeenCalledWith(
      "P",
      JSON.stringify({ x: 1 }),
      { storage: "auto" }
    );
    expect(deletePreferences).toHaveBeenCalledWith("P:root", {
      storage: "auto",
    });
    expect(deletePreferences).toHaveBeenCalledWith("P:aaaaaaaa", {
      storage: "auto",
    });
  });

  it("auto writes split and removes previous single key", async () => {
    vi.mocked(getPreferencesModule.getPreferences).mockResolvedValue({
      P: "old-single",
    });
    vi.mocked(updatePreferences).mockResolvedValue();
    vi.mocked(deletePreferences).mockResolvedValue();

    await updatePreference("P", { data: "x".repeat(300) }, { storage: "auto" });

    expect(
      vi.mocked(updatePreferences).mock.calls.some(([key]) => key === "P:root")
    ).toBe(true);
    expect(deletePreferences).toHaveBeenCalledWith("P", { storage: "auto" });
  });
});
