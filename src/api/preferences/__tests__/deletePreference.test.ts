import { beforeEach, describe, expect, it, vi } from "vitest";
import { deletePreferences } from "../deletePreferences";
import { deletePreference } from "../deletePreference";
import { getPreferences } from "../getPreferences";

vi.mock("../getPreferences", () => ({
  getPreferences: vi.fn(),
}));
vi.mock("../deletePreferences", () => ({
  deletePreferences: vi.fn(),
}));

describe("deletePreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for invalid key", async () => {
    await expect(deletePreference("bad/key")).rejects.toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });

  it("auto deletes single and split storage when both exist", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      P: "single",
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await deletePreference("P", { storage: "auto" });

    expect(deletePreferences).toHaveBeenCalledWith("P", { storage: "auto" });
    expect(deletePreferences).toHaveBeenCalledWith("P:root", {
      storage: "auto",
    });
    expect(deletePreferences).toHaveBeenCalledWith("P:aaaaaaaa", {
      storage: "auto",
    });
  });

  it("single mode only deletes the single key", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      P: "single",
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await deletePreference("P", { storage: "single" });

    expect(deletePreferences).toHaveBeenCalledTimes(1);
    expect(deletePreferences).toHaveBeenCalledWith("P", { storage: "single" });
  });

  it("split mode only deletes split keys", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      P: "single",
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await deletePreference("P", { storage: "split" });

    expect(deletePreferences).not.toHaveBeenCalledWith("P", {
      storage: "split",
    });
    expect(deletePreferences).toHaveBeenCalledWith("P:root", {
      storage: "split",
    });
    expect(deletePreferences).toHaveBeenCalledWith("P:aaaaaaaa", {
      storage: "split",
    });
  });
});
