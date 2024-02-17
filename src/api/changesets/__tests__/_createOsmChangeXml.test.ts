import { describe, expect, it } from "vitest";
import { createOsmChangeXml } from "../_createOsmChangeXml";
import type { OsmChange } from "../../../types";

const boilerplate = <const>{
  changeset: 0,
  timestamp: "",
  uid: 0,
  user: "",
  version: 0,
};

describe("_createOsmChangeXml", () => {
  it("generates XML from the JSON", () => {
    const osmChange: OsmChange = {
      create: [
        {
          type: "node",
          id: -1,
          ...boilerplate,
          lat: -36,
          lon: 174,
          tags: { amenity: "cafe", name: "Café Contigo" },
        },
      ],
      modify: [
        {
          type: "way",
          id: -2,
          ...boilerplate,
          nodes: [10, 11, 12, 13, 10],
          tags: { building: "yes" },
        },
      ],
      delete: [],
    };
    const xml = createOsmChangeXml(123, osmChange, {
      created_by: "me",
      comment: "add café",
    });
    expect(xml).toMatchInlineSnapshot(`
      "<osmChange version="0.6" generator="osm-api-js">
        <changeset>
          <created_by>me</created_by>
          <comment>add café</comment>
        </changeset>
        <create>
          <node id="-1" version="0" changeset="123" lat="-36" lon="174">
            <tag k="amenity" v="cafe"/>
            <tag k="name" v="Café Contigo"/>
          </node>
        </create>
        <modify>
          <way id="-2" version="0" changeset="123">
            <tag k="building" v="yes"/>
            <nd ref="10"/>
            <nd ref="11"/>
            <nd ref="12"/>
            <nd ref="13"/>
            <nd ref="10"/>
          </way>
        </modify>
        <delete if-unused="true"/>
      </osmChange>
      "
    `);
  });
});
