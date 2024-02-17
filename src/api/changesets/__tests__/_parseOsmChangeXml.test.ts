import { describe, expect, it } from "vitest";
import { parseOsmChangeXml } from "../_parseOsmChangeXml";

describe("_parseOsmChangeXml", () => {
  it("generates JSON from the XML", () => {
    const input = `
      <osmChange version="0.6" generator="osm-api-js">
        <changeset>
          <tag k="created_by" v="me"/>
          <tag k="comment" v="add café"/>
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
    `;
    expect(parseOsmChangeXml(input)).toStrictEqual({
      changeset: { comment: "add café", created_by: "me" },
      create: [
        {
          changeset: 123,
          id: -1,
          lat: -36,
          lon: 174,
          tags: {
            amenity: "cafe",
            name: "Café Contigo",
          },
          timestamp: undefined,
          type: "node",
          uid: NaN,
          user: undefined,
          version: 0,
        },
      ],
      delete: [],
      modify: [
        {
          changeset: 123,
          id: -2,
          nodes: [10, 11, 12, 13, 10],
          tags: {
            building: "yes",
          },
          timestamp: undefined,
          type: "way",
          uid: NaN,
          user: undefined,
          version: 0,
        },
      ],
    });
  });
});
