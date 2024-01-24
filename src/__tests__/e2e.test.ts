import { beforeAll, describe, expect, it } from "vitest";
import {
  configure,
  getCapabilities,
  getChangesetDiff,
  getFeature,
  getNotesForQuery,
  getUIdFromDisplayName,
  getUser,
  listChangesets,
} from "..";

/**
 * these tests call the real dev API.
 *
 * Only useful for the XML apis that require transformation
 */

const GribblehirstBbox = <const>[
  174.738948, -36.880984, 174.741083, -36.880065,
];

describe("end to end tests", () => {
  beforeAll(() => {
    configure({
      apiUrl: "https://master.apis.dev.openstreetmap.org",
    });
  });

  it("getCapabilities", async () => {
    expect(await getCapabilities()).toMatchSnapshot();
  });

  it.each`
    full
    ${true}
    ${false}
  `("getFeature full=$full", async ({ full }) => {
    expect(await getFeature("way", 4305800016, full)).toMatchSnapshot();
  });

  it("getUIdFromDisplayName", async () => {
    expect(await getUIdFromDisplayName("kylenz_testing")).toBe(12248);
  });

  it("getUser", async () => {
    expect(await getUser(12248)).toMatchSnapshot();
  });

  it("listChangesets", async () => {
    expect(
      await listChangesets({
        bbox: GribblehirstBbox,
        display_name: "kylenz_testing",
      })
    ).toMatchSnapshot();
  });

  it("getChangesetDiff", async () => {
    expect(await getChangesetDiff(227200)).toMatchSnapshot();
  });

  it("getNotesForQuery", async () => {
    expect(await getNotesForQuery({ q: "cycleway" })).toMatchSnapshot();
  });
});
