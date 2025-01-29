import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OsmChange, OsmFeature, OsmFeatureType } from "../../../types";
import { uploadChangeset } from "../uploadChangeset";
import { chunkOsmChange } from "../chunkOsmChange";
import { osmFetch } from "../../_osmFetch";

let nextId = 0;
vi.mock("../../_osmFetch", () => ({ osmFetch: vi.fn(() => ++nextId) }));

/** use with {@link Array.sort} to randomise the order */
const shuffle = () => 0.5 - Math.random();

const createMockFeatures = (
  type: OsmFeatureType,
  count: number,
  _label: string
) =>
  Array.from<OsmFeature>({ length: count }).fill(<never>{
    type,
    _label,
    nodes: [],
    members: [],
  });

describe("uploadChangeset", () => {
  beforeEach(() => {
    nextId = 0;
    vi.clearAllMocks();
    chunkOsmChange.DEFAULT_LIMIT = 6; // don't do this in production
  });

  const huge: OsmChange = {
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

  it("splits changesets into chunks and uploads them in a schematically valid order", async () => {
    const output = await uploadChangeset({ created_by: "me" }, huge);

    expect(osmFetch).toHaveBeenCalledTimes(12);

    for (const index of [0, 1, 2, 3]) {
      expect(osmFetch).toHaveBeenNthCalledWith(
        1 + 3 * index, // 3 API requests per changeset
        "/0.6/changeset/create",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="created_by" v="me"/>
    <tag k="chunk" v="${index + 1}/4"/>
  </changeset>
</osm>
`,
        })
      );
    }

    expect(output).toBe(1);
  });

  it("splits changesets into chunks and suports a custom tag function", async () => {
    const output = await uploadChangeset({ created_by: "me" }, huge, {
      onChunk: ({ changesetIndex, changesetTotal, featureCount }) => ({
        comment: "hiiii",
        part: `${changesetIndex + 1} out of ${changesetTotal}`,
        totalSize: featureCount.toLocaleString("en"),
      }),
    });

    expect(osmFetch).toHaveBeenCalledTimes(12);

    for (const index of [0, 1, 2, 3]) {
      expect(osmFetch).toHaveBeenNthCalledWith(
        1 + 3 * index, // 3 API requests per changeset
        "/0.6/changeset/create",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="comment" v="hiiii"/>
    <tag k="part" v="${index + 1} out of 4"/>
    <tag k="totalSize" v="20"/>
  </changeset>
</osm>
`,
        })
      );
    }

    expect(output).toBe(1);
  });
});
