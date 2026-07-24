/* eslint-disable unicorn/prevent-abbreviations -- db is not ambiguous */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OsmChange, OsmFeature, OsmFeatureType } from "../../../types";
import { uploadChangeset } from "../uploadChangeset";
import { chunkOsmChange } from "../chunkOsmChange";
import { osmFetch } from "../../_osmFetch";
import { version } from "../../../../package.json";
import { parseOsmChangeXml } from "../_parseOsmChangeXml";
import type { RawUploadResponse } from "../../_rawResponse";

vi.mock("../../_osmFetch");

/**
 * mocks the OSM API, should behave the same
 * for uploading/downloading features.
 */
class MockDatabase {
  #nextId: Partial<Record<OsmFeatureType | "changeset", number>> = {};

  #db: OsmFeature[];

  getNextId(type: OsmFeatureType | "changeset") {
    this.#nextId[type] ||= 0;
    return ++this.#nextId[type];
  }

  constructor(db: OsmFeature[] = []) {
    this.#db = structuredClone(db);
  }

  getFeature(type: OsmFeatureType, ids: number[]) {
    return {
      elements: this.#db.filter((x) => x.type === type && ids.includes(x.id)),
    };
  }

  onUpload = vi.fn(async (_osmChange: OsmChange) => {
    const osmChange = structuredClone(_osmChange);
    const response: RawUploadResponse = {
      diffResult: [{ $: { generator: "", version: "" } }],
    };

    const count = Object.values(osmChange).flat().length;
    if (!count) throw new Error("OsmChange is empty");

    // create is easy. just need to allocate a new ID
    this.#db.push(
      ...osmChange.create.map((feature) => {
        const oldId = feature.id;
        const newId = this.getNextId(feature.type);

        feature.version = 1;

        response.diffResult[0][feature.type] ||= [];
        response.diffResult[0][feature.type]!.push({
          $: {
            old_id: `${oldId}`,
            new_id: `${newId}`,
            new_version: `${feature.version}`,
          },
        });
        return { ...feature, id: newId };
      })
    );

    // modify & delete needs to check for conflicts
    for (const type of <const>["modify", "delete"]) {
      for (const local of osmChange[type]) {
        const remoteIndex = this.#db.findIndex(
          (x) => x.type === local.type && x.id === local.id
        );
        const remote = this.#db[remoteIndex];

        const diffId = `${local.type[0]}${local.id}@(${local.version}…${remote?.version || ""})`;

        if (!remote) throw new Error(`404 ${local.type}/${local.id}`);
        if (remote.version !== local.version) {
          throw Object.assign(new Error(`409 ${diffId}`), { cause: 409 });
        }

        local.version++;

        response.diffResult[0][local.type] ||= [];
        response.diffResult[0][local.type]!.push({
          $: {
            old_id: `${local.id}`,
            new_id: `${local.id}`,
            new_version: `${local.version}`,
          },
        });

        if (type === "delete") {
          this.#db.splice(remoteIndex, 1);
        } else {
          this.#db[remoteIndex] = local;
        }
      }
    }

    return response;
  });

  onRequest: typeof osmFetch = async <T>(
    url: string,
    _qs: unknown,
    options?: RequestInit
  ): Promise<T> => {
    if (url.endsWith("/create")) return <T>this.getNextId("changeset");

    if (url.endsWith("/close")) return <T>undefined;

    if (url.endsWith("/upload")) {
      let xml;
      if ("Content-Encoding" in options!.headers!) {
        const stream = new Response(options?.body).body!.pipeThrough(
          new DecompressionStream("gzip")
        );
        xml = await new Response(stream).text();
      } else {
        xml = <string>options!.body;
      }
      const json = parseOsmChangeXml(xml);
      return this.onUpload(json) as T;
    }

    const getMatch = url.match(/(node|way|relation)s\.json/)?.[1];
    if (getMatch) {
      return <T>(
        this.getFeature(
          <OsmFeatureType>getMatch,
          new URLSearchParams(url.split("?")[1])
            .get(`${getMatch}s`)!
            .split(",")
            .map(Number)
        )
      );
    }

    // update changeset tags
    if (/\/0.6\/changeset\/(\d+)/.test(url)) return <T>undefined;

    throw new Error(`invalid request ${url}`);
  };
}

let db: MockDatabase;

/** useless props */
const JUNK: Omit<OsmFeature, "id" | "type" | "version"> = {
  changeset: -1,
  timestamp: "",
  uid: -1,
  user: "",
};

const MOCK_FEATURES: OsmFeature[] = [
  { ...JUNK, type: "node", id: 1, version: 1, lat: 0, lon: 0 },
  { ...JUNK, type: "node", id: 2, version: 2, lat: 0, lon: 0 },
  { ...JUNK, type: "way", id: 1, version: 2, nodes: [1, 2] },
  { ...JUNK, type: "way", id: 2, version: 1, nodes: [2, 1] },
  {
    ...JUNK,
    type: "relation",
    id: 1,
    version: 10,
    members: [{ ref: 1, type: "node", role: "" }],
  },
  {
    ...JUNK,
    type: "relation",
    id: 2,
    version: 21,
    members: [{ ref: 1, type: "way", role: "outer" }],
  },
  {
    ...JUNK,
    type: "relation",
    id: 3,
    version: 1,
    members: [{ ref: 1, type: "way", role: "outer" }],
  },
  {
    ...JUNK,
    type: "relation",
    id: 4,
    version: 1,
    members: [{ ref: 1, type: "way", role: "outer" }],
  },

  // these are already deleted in the database:
  { ...JUNK, type: "node", id: 3, version: 2, lat: 0, lon: 0, visible: false },
];

describe("uploadChangeset", () => {
  beforeEach(() => {
    db = new MockDatabase(MOCK_FEATURES);
    vi.mocked(osmFetch).mockImplementation(db.onRequest);
    vi.clearAllMocks();
    chunkOsmChange.DEFAULT_LIMIT = 6; // don't do this in production
  });

  const huge: OsmChange = {
    create: [
      {
        ...JUNK,
        type: "relation",
        id: -300000,
        version: 1,
        members: [{ ref: -3, type: "way", role: "inner" }],
      },
      { ...JUNK, type: "node", id: -100, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "way", id: -3, version: 1, nodes: [-100, -2] },
      { ...JUNK, type: "node", id: -4, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -5, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -6, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -7, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -2, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -8, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -9, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -10, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "node", id: -11, version: 1, lat: 0, lon: 0 },
    ],
    modify: [
      { ...JUNK, type: "node", id: 1, version: 1, lat: 0, lon: 0 },
      { ...JUNK, type: "relation", id: 1, version: 10, members: [] },
      { ...JUNK, type: "way", id: 1, version: 2, nodes: [600, 601] },
    ],
    delete: [
      { ...JUNK, type: "relation", id: 2, version: 21, members: [] },
      { ...JUNK, type: "node", id: 2, version: 2, lat: 0, lon: 0 },
      { ...JUNK, type: "relation", id: 3, version: 1, members: [] },
      { ...JUNK, type: "way", id: 2, version: 1, nodes: [600, 601] },
      { ...JUNK, type: "relation", id: 4, version: 1, members: [] },
    ],
  };

  it("adds a fallback created_by tag", async () => {
    const output = await uploadChangeset(
      { comment: "added a building" },
      { create: [MOCK_FEATURES[0]], modify: [], delete: [] }
    );
    expect(output).toStrictEqual({
      1: { diffResult: { node: { 1: { newId: 1, newVersion: 1 } } } },
    });

    expect(osmFetch).toHaveBeenCalledTimes(3);
    expect(osmFetch).toHaveBeenNthCalledWith(
      1,
      "/0.6/changeset/create",
      undefined,
      expect.objectContaining({
        body: `<osm>
  <changeset>
    <tag k="comment" v="added a building"/>
    <tag k="created_by" v="osm-api-js ${version}"/>
  </changeset>
</osm>
`,
      })
    );
  });

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

    expect(output).toStrictEqual({
      // create nodes first.
      1: {
        diffResult: {
          node: {
            "-10": { newId: 2, newVersion: 1 },
            "-11": { newId: 1, newVersion: 1 },
            "-2": { newId: 5, newVersion: 1 },
            "-7": { newId: 6, newVersion: 1 },
            "-8": { newId: 4, newVersion: 1 },
            "-9": { newId: 3, newVersion: 1 },
          },
        },
      },
      // create nodes then ways then relations next
      2: {
        diffResult: {
          node: {
            "-100": { newId: 10, newVersion: 1 },
            "-4": { newId: 9, newVersion: 1 },
            "-5": { newId: 8, newVersion: 1 },
            "-6": { newId: 7, newVersion: 1 },
          },
          relation: { "-300000": { newId: 1, newVersion: 1 } },
          way: { "-3": { newId: 1, newVersion: 1 } },
        },
      },
      // modify and delete next (any order)
      3: {
        diffResult: {
          node: {
            1: { newId: 1, newVersion: 2 },
            2: { newId: 2, newVersion: 3 },
          },
          relation: {
            2: { newId: 2, newVersion: 22 },
            3: { newId: 3, newVersion: 2 },
            4: { newId: 4, newVersion: 2 },
          },
          way: { 2: { newId: 2, newVersion: 2 } },
        },
      },
      // delete last
      4: {
        diffResult: {
          relation: { 1: { newId: 1, newVersion: 11 } },
          way: { 1: { newId: 1, newVersion: 3 } },
        },
      },
    });
  });

  it("splits changesets into chunks and suports a custom tag function", async () => {
    const output = await uploadChangeset({ created_by: "me" }, huge, {
      onChunk: ({ changesetIndex, changesetTotal, featureCount }) => ({
        comment: "hiiii",
        created_by: "MyCoolApp",
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
    <tag k="created_by" v="MyCoolApp"/>
    <tag k="part" v="${index + 1} out of 4"/>
    <tag k="totalSize" v="20"/>
  </changeset>
</osm>
`,
        })
      );
    }

    // don't need to assert the output, since it's the same
    // as the previous test case.
    expect(Object.keys(output).map(Number)).toStrictEqual([1, 2, 3, 4]);
  });

  describe("merge conflicts", () => {
    it("rejects changesets with merge conflicts and no callback", async () => {
      // trying to modify node2, our base version is 1, but the DB already has v2.
      const osmChange: OsmChange = {
        create: [],
        modify: [{ ...JUNK, type: "node", id: 2, version: 1, lat: 0, lon: 0 }],
        delete: [],
      };
      await expect(() =>
        uploadChangeset({ created_by: "me" }, osmChange)
      ).rejects.toThrow(
        new Error(
          "A auto-mergable conflict occured for n2@(1…2), but neither onAutomaticConflict nor onManualConflict is not defined."
        )
      );
    });

    it("rejects complex changesets with merge conflicts and only an automatic callback, no manual callback", async () => {
      // trying to modify node2, our base version is 1, but the DB already has v2.
      const osmChange: OsmChange = {
        create: [],
        modify: [{ ...JUNK, type: "node", id: 2, version: 1, lat: 1, lon: 1 }],
        delete: [],
      };
      await expect(() =>
        uploadChangeset({ created_by: "me" }, osmChange, {
          onAutomaticConflict: () => ({}),
        })
      ).rejects.toThrow(
        new Error(
          "A complex merge conflict occured for n2@(1…2), but onManualConflict is not defined."
        )
      );
    });

    it("rejects changesets if the merge conflict callback returns false", async () => {
      // trying to modify node2, our base version is 1, but the DB already has v2.
      const osmChange: OsmChange = {
        create: [],
        modify: [{ ...JUNK, type: "node", id: 2, version: 1, lat: 0, lon: 0 }],
        delete: [],
      };
      await expect(() =>
        uploadChangeset({ created_by: "me" }, osmChange, {
          onManualConflict: () => false,
        })
      ).rejects.toThrow(
        new Error(
          "A merge conflict occured, but onManualConflict returned false for n2@(1…2)"
        )
      );
    });

    it("uploads changesets after the user manually resolves conflicts", async () => {
      // trying to modify node2, our base version is 1, but the DB already has v2.
      const osmChange: OsmChange = {
        create: [],
        modify: [
          { ...JUNK, type: "node", id: 2, version: 1, lat: -36, lon: 174 },
        ],
        delete: [],
      };

      const onProgress = vi.fn();

      const output = await uploadChangeset(
        { created_by: "me", source: "hi" },
        osmChange,
        {
          onManualConflict: ({ local }) => ({
            merged: { ...local, lat: -35 }, // pretend to do some sort of merging
            tags: { custom_changeset_tag: "yeah" },
          }),
          onProgress,
          disableCompression: true,
        }
      );

      expect(output).toStrictEqual({
        1: { diffResult: { node: { 2: { newId: 2, newVersion: 3 } } } },
      });

      expect(osmFetch).toHaveBeenCalledTimes(6);

      // create
      expect(osmFetch).toHaveBeenNthCalledWith(
        1,
        "/0.6/changeset/create",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="created_by" v="me"/>
    <tag k="source" v="hi"/>
  </changeset>
</osm>
`,
        })
      );

      // first upload attempt (version is set to 1)
      expect(osmFetch).toHaveBeenNthCalledWith(
        2,
        "/0.6/changeset/1/upload",
        undefined,
        expect.objectContaining({
          body: `<osmChange version="0.6" generator="osm-api-js">
  <create/>
  <modify>
    <node id="2" version="1" changeset="1" lat="-36" lon="174"/>
  </modify>
  <delete if-unused="true"/>
</osmChange>
`,
        })
      );

      // now it tries to fetch the conflicting features
      expect(osmFetch).toHaveBeenNthCalledWith(
        3,
        "/0.6/nodes.json?nodes=2",
        undefined,
        undefined
      );

      // and then update the changeset tags
      expect(osmFetch).toHaveBeenNthCalledWith(
        4,
        "/0.6/changeset/1",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="custom_changeset_tag" v="yeah"/>
    <tag k="created_by" v="me"/>${/* it kept created_by, even tho we didn't return it */ ""}
    <tag k="merge_conflict_resolved" v="manually"/>
  </changeset>
</osm>
`,
        })
      );

      // second upload attempt (version is set to 2), result is the merged version (lat=-35)
      expect(osmFetch).toHaveBeenNthCalledWith(
        5,
        "/0.6/changeset/1/upload",
        undefined,
        expect.objectContaining({
          body: `<osmChange version="0.6" generator="osm-api-js">
  <create/>
  <modify>
    <node id="2" version="2" changeset="1" lat="-35" lon="174"/>
  </modify>
  <delete if-unused="true"/>
</osmChange>
`,
        })
      );

      // finally we can close the changeset
      expect(osmFetch).toHaveBeenNthCalledWith(
        6,
        "/0.6/changeset/1/close",
        undefined,
        expect.anything()
      );

      expect(onProgress).toHaveBeenCalledTimes(6);
      expect(onProgress).toHaveBeenNthCalledWith(1, {
        phase: "upload",
        step: 0,
        total: 1,
      });
      expect(onProgress).toHaveBeenNthCalledWith(2, {
        phase: "upload",
        step: 1 / 3,
        total: 1,
      });
      expect(onProgress).toHaveBeenNthCalledWith(3, {
        phase: "merge_conflicts",
        step: 0,
        total: 2,
      });
      expect(onProgress).toHaveBeenNthCalledWith(4, {
        phase: "merge_conflicts",
        step: 1,
        total: 2,
      });
      expect(onProgress).toHaveBeenNthCalledWith(5, {
        phase: "merge_conflicts",
        step: 2,
        total: 2,
      });
      expect(onProgress).toHaveBeenNthCalledWith(6, {
        phase: "upload",
        step: 2 / 3,
        total: 1,
      });
    });

    it("can automatically resolve conflicts if both local+remote are identical", async () => {
      // trying to modify node2, our base version is 1, but the DB already has v2.
      const osmChange: OsmChange = {
        create: [],
        modify: [{ ...JUNK, type: "node", id: 2, version: 1, lat: 0, lon: 0 }],
        delete: [],
      };
      const output = await uploadChangeset({ created_by: "me" }, osmChange, {
        onAutomaticConflict: () => ({}),
        disableCompression: true,
      });
      expect(output).toStrictEqual({
        1: { diffResult: { node: { 2: { newId: 2, newVersion: 3 } } } },
      });

      expect(osmFetch).toHaveBeenCalledTimes(6);
      // 1 create changeset
      // 2 upload first attempt
      // 3 get conflicting feature
      // 4 update changeset tags
      // 5 update changeset content
      // 6 close changeset

      // don't need to assert this all, since we've tested it above.
      // only (4) and (5) are interesting.

      //  update the changeset tags
      expect(osmFetch).toHaveBeenNthCalledWith(
        4,
        "/0.6/changeset/1",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="created_by" v="me"/>${/* it kept created_by, even tho we didn't return it */ ""}
    <tag k="merge_conflict_resolved" v="automatically"/>
  </changeset>
</osm>
`,
        })
      );

      // second upload attempt (version is set to 2)
      expect(osmFetch).toHaveBeenNthCalledWith(
        5,
        "/0.6/changeset/1/upload",
        undefined,
        expect.objectContaining({
          body: `<osmChange version="0.6" generator="osm-api-js">
  <create/>
  <modify>
    <node id="2" version="2" changeset="1" lat="0" lon="0"/>
  </modify>
  <delete if-unused="true"/>
</osmChange>
`,
        })
      );
    });

    it("can automatically resolve trivial conflicts", async () => {
      // trying to modify node3, our base version is v1, but the DB already has v2.
      // this can be automerged because it's a delete action on both local+remote
      const osmChange: OsmChange = {
        create: [],
        modify: [],
        delete: [
          {
            ...JUNK,
            type: "node",
            id: 3,
            version: 1,
            lat: 0,
            lon: 0,
            visible: false,
          },
        ],
      };
      const output = await uploadChangeset({ created_by: "me" }, osmChange, {
        onAutomaticConflict: () => ({ tags: { created_by: "my app!" } }),
        disableCompression: true,
      });
      expect(output).toStrictEqual({
        1: { diffResult: { node: { 3: { newId: 3, newVersion: 3 } } } },
      });

      expect(osmFetch).toHaveBeenCalledTimes(6);
      // 1 create changeset
      // 2 upload first attempt
      // 3 get conflicting feature
      // 4 update changeset tags
      // 5 update changeset content
      // 6 close changeset

      // don't need to assert this all, since we've tested it above.
      // only (4) and (5) are interesting.

      //  update the changeset tags
      expect(osmFetch).toHaveBeenNthCalledWith(
        4,
        "/0.6/changeset/1",
        undefined,
        expect.objectContaining({
          body: `<osm>
  <changeset>
    <tag k="created_by" v="my app!"/>${/* value was changed */ ""}
    <tag k="merge_conflict_resolved" v="automatically"/>
  </changeset>
</osm>
`,
        })
      );

      // second upload attempt (version is set to 2)
      expect(osmFetch).toHaveBeenNthCalledWith(
        5,
        "/0.6/changeset/1/upload",
        undefined,
        expect.objectContaining({
          body: `<osmChange version="0.6" generator="osm-api-js">
  <create/>
  <modify/>
  <delete if-unused="true">
    <node id="3" version="2" changeset="1" lat="0" lon="0"/>
  </delete>
</osmChange>
`,
        })
      );
    });

    it("does not enter the merge-conflict loop if a non-409 error occurs", async () => {
      const onManualConflict = vi.fn();
      await expect(() =>
        uploadChangeset(
          { created_by: "me" },
          { create: [], modify: [], delete: [] },
          { onManualConflict }
        )
      ).rejects.toThrow(new Error("OsmChange is empty"));

      expect(onManualConflict).not.toHaveBeenCalled();
    });

    // end of merge conflict tests
  });

  // end of tests
});
