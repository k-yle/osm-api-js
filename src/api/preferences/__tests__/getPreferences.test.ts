import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPreferences } from "../getPreferences";
import { osmFetch } from "../../_osmFetch";

vi.mock("../../_osmFetch", () => ({
  osmFetch: vi.fn(),
}));

describe("getPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns raw API keys with handleStorage: raw", async () => {
    vi.mocked(osmFetch).mockResolvedValue({
      preferences: {
        P: "single",
        "P:root": "aaaaaaaa",
        "P:aaaaaaaa": "split",
      },
    });

    await expect(
      getPreferences({ handleStorage: "raw" })
    ).resolves.toStrictEqual({
      P: "single",
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });
  });

  it("returns merged logical keys by default", async () => {
    vi.mocked(osmFetch).mockResolvedValue({
      preferences: {
        P: "single",
        "P:root": "aaaaaaaa",
        "P:aaaaaaaa": "split",
        X: "value",
      },
    });

    await expect(getPreferences()).resolves.toStrictEqual({
      P: "split",
      X: "value",
    });
  });
});
