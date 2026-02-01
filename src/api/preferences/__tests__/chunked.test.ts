import { describe, expect, it } from "vitest";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  type PackChunkedResult,
  assertPreferenceKey,
  hasSingleKey,
  hasSplitKey,
  mergePreferencesToLogical,
  packChunked,
  resolveValueForKey,
  unpackChunked,
} from "../chunked";

/** Mock Standard Schema that accepts object with foo string and returns it. */
const passThroughSchema: StandardSchemaV1<unknown, { foo: string }> = {
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

async function roundTrip(
  prefix: string,
  value: string,
  previousRootValue?: string
): Promise<{ packed: PackChunkedResult; unpacked: string | null }> {
  const packed = await packChunked(prefix, value, previousRootValue, 255);
  const preferences: Record<string, string> = {
    [packed.rootKey]: packed.rootValue,
    ...packed.chunks,
  };
  const unpacked = unpackChunked(preferences, prefix);
  return { packed, unpacked };
}

describe("assertPreferenceKey", () => {
  it("throws when key contains /", () => {
    expect(() => assertPreferenceKey("key/path")).toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });
  it("throws when key contains ?", () => {
    expect(() => assertPreferenceKey("key?query")).toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });
  it("throws when key contains #", () => {
    expect(() => assertPreferenceKey("key#hash")).toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });
  it("throws when key contains \\", () => {
    expect(() => assertPreferenceKey("key\\back")).toThrow(
      /Preference key must not contain.*unsafe in URL path/
    );
  });
  it("does not throw for key with colon", () => {
    expect(() => assertPreferenceKey("foo:bar")).not.toThrow();
  });
  it("does not throw for simple key", () => {
    expect(() => assertPreferenceKey("mykey")).not.toThrow();
  });
});

describe("packChunked", () => {
  it("exposes MAX_PAYLOAD_BYTES to consumers", () => {
    expect(packChunked.MAX_PAYLOAD_BYTES).toBeTypeOf("number");
    expect(packChunked.MAX_PAYLOAD_BYTES).toBe(28 * 255);
  });

  it("round-trips empty string", async () => {
    const { packed, unpacked } = await roundTrip("ESS", "");
    expect(unpacked).toBe("");
    expect(packed.rootKey).toBe("ESS:root");
    expect(packed.oldKeysToDelete).toStrictEqual([]);
    expect(Object.keys(packed.chunks)).toHaveLength(1);
  });

  it("round-trips single-chunk string under 255 chars", async () => {
    const value = "hello";
    const { packed, unpacked } = await roundTrip("ESS", value);
    expect(unpacked).toBe(value);
    expect(packed.rootKey).toBe("ESS:root");
    expect(packed.oldKeysToDelete).toStrictEqual([]);
    expect(Object.keys(packed.chunks)).toHaveLength(1);
  });

  it("round-trips multi-chunk string", async () => {
    const value = `${"a".repeat(255)}${"b".repeat(255)}tail`;
    const { packed, unpacked } = await roundTrip("ESS", value);
    expect(unpacked).toBe(value);
    expect(packed.rootKey).toBe("ESS:root");
    const hashes = packed.rootValue.split(",");
    expect(hashes).toHaveLength(3);
    expect(Object.keys(packed.chunks)).toHaveLength(3);
  });

  it("returns same hash for same chunk content", async () => {
    const value = "same";
    const a = await packChunked("P", value);
    const b = await packChunked("P", value);
    expect(a.rootValue).toBe(b.rootValue);
    expect(Object.keys(a.chunks)[0]).toBe(Object.keys(b.chunks)[0]);
  });

  it("computes oldKeysToDelete from previous root", async () => {
    const first = await packChunked("P", "old");
    const second = await packChunked("P", "new", first.rootValue, 255);
    expect(second.oldKeysToDelete).toHaveLength(1);
    expect(second.oldKeysToDelete[0]).toMatch(/^P:[\da-f]{8}$/);
  });

  it("throws when value exceeds MAX_PAYLOAD_BYTES", async () => {
    const tooLong = "x".repeat(packChunked.MAX_PAYLOAD_BYTES + 1);
    await expect(packChunked("ESS", tooLong)).rejects.toThrow(
      /Preference value exceeds maximum size/
    );
  });
});

describe("unpackChunked", () => {
  it("returns null when root is missing", () => {
    expect(unpackChunked({}, "ESS")).toBeNull();
  });

  it("returns null when root is empty string", () => {
    expect(unpackChunked({ "ESS:root": "" }, "ESS")).toBeNull();
  });

  it("returns null when a chunk is missing", async () => {
    const value = "a".repeat(300);
    const packed = await packChunked("ESS", value);
    const chunkKeys = Object.keys(packed.chunks);
    const preferences: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      [chunkKeys[0]!]: packed.chunks[chunkKeys[0]!]!,
      // omit chunkKeys[1]
    };
    expect(unpackChunked(preferences, "ESS")).toBeNull();
  });

  it("returns concatenated string when all chunks present", async () => {
    const value = "a".repeat(300);
    const { packed, unpacked } = await roundTrip("X", value);
    expect(unpacked).toBe(value);
    expect(packed.chunks).toBeDefined();
  });

  it("with schema returns { value } for valid JSON that passes validation", async () => {
    const json = JSON.stringify({ foo: "bar" });
    const packed = await packChunked("ESS", json);
    const preferences: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const result = await unpackChunked(preferences, "ESS", passThroughSchema);
    expect(result).not.toBeNull();
    expect("value" in result!).toBe(true);
    expect((result as { value: { foo: string } }).value).toStrictEqual({
      foo: "bar",
    });
  });

  it("with schema returns { issues } for invalid JSON", async () => {
    const packed = await packChunked("ESS", "not json {");
    const preferences: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const result = await unpackChunked(preferences, "ESS", passThroughSchema);
    expect(result).not.toBeNull();
    expect("issues" in result!).toBe(true);
    expect(
      (result as { issues: readonly { message: string }[] }).issues[0]?.message
    ).toBe("Invalid JSON");
  });

  it("with schema returns { issues } when validation fails", async () => {
    const packed = await packChunked("ESS", JSON.stringify({ bar: 1 }));
    const preferences: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const result = await unpackChunked(preferences, "ESS", passThroughSchema);
    expect(result).not.toBeNull();
    expect("issues" in result!).toBe(true);
  });

  it("with schema returns null when raw is null", async () => {
    const result = await unpackChunked({}, "ESS", passThroughSchema);
    expect(result).toBeNull();
  });
});

describe("hasSingleKey / hasSplitKey / resolveValueForKey", () => {
  it("hasSingleKey true when key present", () => {
    expect(hasSingleKey({ foo: "v" }, "foo")).toBe(true);
    expect(hasSingleKey({ foo: "" }, "foo")).toBe(true);
  });
  it("hasSingleKey false when key absent", () => {
    expect(hasSingleKey({}, "foo")).toBe(false);
    expect(hasSingleKey({ "foo:root": "x" }, "foo")).toBe(false);
  });
  it("hasSplitKey true when prefix:root present", () => {
    expect(hasSplitKey({ "foo:root": "h1" }, "foo")).toBe(true);
  });
  it("hasSplitKey false when no root", () => {
    expect(hasSplitKey({}, "foo")).toBe(false);
    expect(hasSplitKey({ foo: "v" }, "foo")).toBe(false);
  });
  it("resolveValueForKey single mode returns value or null", () => {
    expect(resolveValueForKey({ foo: "v" }, "foo", "single")).toBe("v");
    expect(resolveValueForKey({}, "foo", "single")).toBeNull();
  });
  it("resolveValueForKey split mode uses unpackChunkedRaw", async () => {
    const packed = await packChunked("P", "hello");
    const prefs: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    expect(resolveValueForKey(prefs, "P", "split")).toBe("hello");
    expect(resolveValueForKey(prefs, "P", "split")).toBe("hello");
    expect(resolveValueForKey({}, "P", "split")).toBeNull();
  });
  it("resolveValueForKey auto returns single when only single", () => {
    expect(resolveValueForKey({ foo: "v" }, "foo", "auto")).toBe("v");
  });
  it("resolveValueForKey auto returns split when only split", async () => {
    const packed = await packChunked("P", "x");
    const prefs: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    expect(resolveValueForKey(prefs, "P", "auto")).toBe("x");
  });
  it("resolveValueForKey auto throws when both single and split", async () => {
    const packed = await packChunked("P", "x");
    const prefs: Record<string, string> = {
      P: "single",
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    expect(() => resolveValueForKey(prefs, "P", "auto")).toThrow(
      /exists as both a single key and split storage/
    );
  });
});

describe("mergePreferencesToLogical", () => {
  it("passes through single keys", () => {
    const prefs = { a: "1", b: "2" };
    expect(mergePreferencesToLogical(prefs)).toStrictEqual({ a: "1", b: "2" });
  });
  it("merges split prefix into one entry", async () => {
    const packed = await packChunked("ESS", "chunked-value");
    const prefs: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const merged = mergePreferencesToLogical(prefs);
    expect(merged).toStrictEqual({ ESS: "chunked-value" });
  });
  it("combines single keys and merged split", async () => {
    const packed = await packChunked("P", "p-value");
    const prefs: Record<string, string> = {
      single: "v",
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const merged = mergePreferencesToLogical(prefs);
    expect(merged["single"]).toBe("v");
    expect(merged["P"]).toBe("p-value");
    expect(Object.keys(merged)).toHaveLength(2);
  });
  it("merges split when logical key contains colon (e.g. foo:bar)", async () => {
    const packed = await packChunked("foo:bar", "x");
    const prefs: Record<string, string> = {
      [packed.rootKey]: packed.rootValue,
      ...packed.chunks,
    };
    const merged = mergePreferencesToLogical(prefs);
    expect(merged["foo:bar"]).toBe("x");
    expect(Object.keys(merged)).toHaveLength(1);
  });
});
