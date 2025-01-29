import { describe, expect, it } from "vitest";
import type { OsmChange, OsmFeature, OsmFeatureType } from "../../../types";
import { chunkOsmChange } from "../chunkOsmChange";
import type { ApiCapabilities } from "../../getCapabilities";

/** use with {@link Array.sort} to randomise the order */
const shuffle = () => 0.5 - Math.random();

const createMockFeatures = (
  type: OsmFeatureType,
  count: number,
  _label: string
) => Array.from<OsmFeature>({ length: count }).fill(<never>{ type, _label });

const capabilities = <ApiCapabilities>{
  api: { changesets: { maximum_elements: 6 } },
};

describe("chunkOsmChange", () => {
  it("returns the input if the changeset is already small enough", () => {
    const input: OsmChange = {
      create: createMockFeatures("node", 3, "create"),
      modify: createMockFeatures("node", 1, "modify"),
      delete: createMockFeatures("node", 1, "delete"),
    };
    expect(chunkOsmChange(input, capabilities)).toStrictEqual([input]);
  });

  it("returns the input if the changeset has exactly the max number of items", () => {
    const input: OsmChange = {
      create: createMockFeatures("node", 3, "create"),
      modify: createMockFeatures("node", 1, "modify"),
      delete: createMockFeatures("node", 2, "delete"),
    };
    expect(chunkOsmChange(input, capabilities)).toStrictEqual([input]);
  });

  it("chunks features in a schematically valid order", () => {
    const input: OsmChange = {
      create: [
        ...createMockFeatures("node", 4, "create"),
        ...createMockFeatures("way", 3, "create"),
        ...createMockFeatures("relation", 4, "create"),
      ].sort(shuffle),
      modify: [
        ...createMockFeatures("node", 1, "modify"),
        ...createMockFeatures("way", 1, "modify"),
        ...createMockFeatures("relation", 1, "modify"),
      ].sort(shuffle),
      delete: [
        ...createMockFeatures("node", 1, "delete"),
        ...createMockFeatures("way", 2, "delete"),
        ...createMockFeatures("relation", 3, "delete"),
      ].sort(shuffle),
    };
    expect(chunkOsmChange(input, capabilities)).toStrictEqual([
      // chunk 1:
      {
        create: [
          ...createMockFeatures("node", 4, "create"),
          ...createMockFeatures("way", 2, "create"),
        ],
        modify: [],
        delete: [],
      },
      // chunk 2:
      {
        create: [
          ...createMockFeatures("way", 1, "create"),
          ...createMockFeatures("relation", 4, "create"),
        ],
        modify: [],
        delete: createMockFeatures("relation", 1, "delete"),
      },
      // chunk 3:
      {
        create: [],
        modify: createMockFeatures("node", 1, "modify"),
        delete: [
          ...createMockFeatures("relation", 2, "delete"),
          ...createMockFeatures("way", 2, "delete"),
          ...createMockFeatures("node", 1, "delete"),
        ],
      },
      // chunk 4:
      {
        create: [],
        modify: [
          ...createMockFeatures("way", 1, "modify"),
          ...createMockFeatures("relation", 1, "modify"),
        ],
        delete: [],
      },
    ]);
  });

  it("exposes the default limit to consumers", () => {
    expect(chunkOsmChange.DEFAULT_LIMIT).toBeTypeOf("number");
  });
});
