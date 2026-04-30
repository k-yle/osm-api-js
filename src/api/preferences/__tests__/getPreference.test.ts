import type { StandardSchemaV1 } from "@standard-schema/spec";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPreference } from "../getPreference";
import { getPreferences } from "../getPreferences";

vi.mock("../getPreferences", () => ({
  getPreferences: vi.fn(),
}));

const objectSchema: StandardSchemaV1<unknown, { foo: string }> = {
  "~standard": {
    version: 1,
    vendor: "test",
    types: { input: undefined as unknown, output: { foo: "" } },
    validate(value: unknown) {
      if (
        value &&
        typeof value === "object" &&
        "foo" in value &&
        typeof (value as { foo: unknown }).foo === "string"
      ) {
        return { value: value as { foo: string } };
      }
      return { issues: [{ message: "expected object with foo string" }] };
    },
  },
};

describe("getPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for invalid key", async () => {
    await expect(getPreference("bad/key")).rejects.toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });

  it("returns single value with storage: single", async () => {
    vi.mocked(getPreferences).mockResolvedValue({ P: "single" });

    await expect(getPreference("P", { storage: "single" })).resolves.toBe(
      "single"
    );
  });

  it("returns split value with storage: split", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });

    await expect(getPreference("P", { storage: "split" })).resolves.toBe(
      "split"
    );
  });

  it("returns null when split chunk is missing", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      "P:root": "aaaaaaaa,bbbbbbbb",
      "P:aaaaaaaa": "hello",
      // P:bbbbbbbb missing
    });

    await expect(getPreference("P", { storage: "split" })).resolves.toBeNull();
  });

  it("throws with storage auto when both single and split exist", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      P: "single",
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": "split",
    });

    await expect(getPreference("P", { storage: "auto" })).rejects.toThrow(
      /exists as both a single key and split storage/
    );
  });

  it("returns { value } for valid schema data", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      "P:root": "aaaaaaaa",
      "P:aaaaaaaa": JSON.stringify({ foo: "bar" }),
    });

    await expect(
      getPreference("P", { storage: "split", schema: objectSchema })
    ).resolves.toStrictEqual({ value: { foo: "bar" } });
  });

  it("returns { issues } for invalid JSON with schema", async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      P: "not-json",
    });

    await expect(
      getPreference("P", { storage: "single", schema: objectSchema })
    ).resolves.toStrictEqual({ issues: [{ message: "Invalid JSON" }] });
  });
});
