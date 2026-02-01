import { describe, expect, it, vi } from "vitest";
import { setChunkedPreference } from "../chunked";
import { deletePreferences } from "../deletePreferences";
import { getPreferences } from "../getPreferences";
import { updatePreferences } from "../updatePreferences";

vi.mock("../getPreferences", () => ({ getPreferences: vi.fn() }));
vi.mock("../updatePreferences", () => ({ updatePreferences: vi.fn() }));
vi.mock("../deletePreferences", () => ({ deletePreferences: vi.fn() }));

describe("setChunkedPreference", () => {
  it("writes chunks in parallel first, then root, then deletes old keys", async () => {
    const updateCalls: [string, string][] = [];
    vi.mocked(getPreferences).mockResolvedValue({});
    vi.mocked(updatePreferences).mockImplementation(async (key, value) => {
      updateCalls.push([key, value]);
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await setChunkedPreference("P", "x");

    expect(updateCalls.length).toBeGreaterThanOrEqual(2);
    const rootCall = updateCalls.find(([k]) => k === "P:root");
    expect(rootCall).toBeDefined();
    expect(updateCalls[updateCalls.length - 1]![0]).toBe("P:root");
    const chunkCalls = updateCalls.slice(0, -1);
    expect(
      chunkCalls.every(([k]) => k.startsWith("P:") && k !== "P:root")
    ).toBe(true);
    // No previous root, so oldKeysToDelete is empty and deletePreferences may not be called
  });

  it("deletes old chunk keys when updating (previous root present)", async () => {
    const oldHash = "deadbeef";
    vi.mocked(getPreferences).mockResolvedValue({
      "P:root": oldHash,
      [`P:${oldHash}`]: "old chunk",
    });
    vi.mocked(updatePreferences).mockResolvedValue();
    vi.mocked(deletePreferences).mockResolvedValue();

    await setChunkedPreference("P", "new");

    expect(deletePreferences).toHaveBeenCalledWith(`P:${oldHash}`, undefined);
  });

  it("deletes orphan chunk keys (not in previous or new root) on write", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "chunk",
      "P:deadbeef": "orphan chunk from failed write",
    });
    vi.mocked(updatePreferences).mockResolvedValue();
    const deletedKeys: string[] = [];
    vi.mocked(deletePreferences).mockImplementation(async (key) => {
      deletedKeys.push(key);
    });

    await setChunkedPreference("P", "x");

    expect(deletedKeys).toContain("P:deadbeef");
  });

  it("retries chunk PUT on failure and eventually succeeds", async () => {
    let chunkPutCount = 0;
    vi.mocked(getPreferences).mockResolvedValue({});
    vi.mocked(updatePreferences).mockImplementation(async (key, value) => {
      if (key !== "P:root") {
        chunkPutCount++;
        if (chunkPutCount <= 2) throw new Error("network");
      }
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await setChunkedPreference("P", "y");

    expect(chunkPutCount).toBe(3);
  });

  it("throws when chunk PUT fails after all retries", async () => {
    vi.mocked(getPreferences).mockResolvedValue({});
    vi.mocked(updatePreferences).mockImplementation(async (key) => {
      if (key !== "P:root") throw new Error("network");
    });
    vi.mocked(deletePreferences).mockResolvedValue();

    await expect(setChunkedPreference("P", "z")).rejects.toThrow("network");
  });
});
