import { OsmChange } from "../types";
import {
  createOsmChangeXml,
  createChangesetMetaXml,
} from "../api/changesets/_createOsmChangeXml";

describe("createChangesetMetaXml", () => {
  it("generates the correct XML", () => {
    expect(
      createChangesetMetaXml({
        comment: "micromapping my high school",
        created_by: "iD 2.20.0",
      })
    ).toBe(
      `<osm>
  <changeset>
    <tag k="comment" v="micromapping my high school"/>
    <tag k="created_by" v="iD 2.20.0"/>
  </changeset>
</osm>
`
    );
  });
});

describe("createOsmChangeXml", () => {
  it("generates the correct XML", () => {
    const osmChange = {
      create: [
        {
          type: "node",
          id: -1,
          lat: -36.94949,
          lon: 174.7676,
          tags: { tourism: "information", information: "board" },
        },
        {
          type: "node",
          id: -3,
          lat: -36.91391836,
          lon: 174.76301235,
        },
      ],
      modify: [
        {
          type: "way",
          id: 4001,
          version: 6,
          tags: { amenity: "ice_cream", building: "yes" },
          nodes: [3001, 3002, 3003, 3004, 3001],
        },
        {
          type: "way",
          id: 4002,
          version: 2,
          tags: { highway: "path", surface: "< & \" ' >" },
          nodes: [3005, 3006, 3007, -3, 3008, 3009, 3010],
        },
        {
          type: "relation",
          id: 5001,
          version: 4,
          tags: { name: "Urban Route 15", type: "route" },
          members: [
            { ref: 4003, role: "outer", type: "way" },
            { ref: 4004, role: "inner", type: "way" },
          ],
        },
      ],
      delete: [
        {
          type: "node",
          id: 3011,
          version: 2,
          tags: { "addr:housenumber": "3", "addr:street": "Delaney Avenue" },
          lat: -36.913179,
          lon: 174.7204874,
        },
      ],
    } as unknown as OsmChange;
    expect(createOsmChangeXml(6001, osmChange)).toBe(
      `<osmChange version="0.6" generator="osm-api-js">
  <create>
    <node id="-1" version="0" changeset="6001" lat="-36.94949" lon="174.7676">
      <tag k="tourism" v="information"/>
      <tag k="information" v="board"/>
    </node>
    <node id="-3" version="0" changeset="6001" lat="-36.91391836" lon="174.76301235"/>
  </create>
  <modify>
    <way id="4001" version="6" changeset="6001">
      <tag k="amenity" v="ice_cream"/>
      <tag k="building" v="yes"/>
      <nd ref="3001"/>
      <nd ref="3002"/>
      <nd ref="3003"/>
      <nd ref="3004"/>
      <nd ref="3001"/>
    </way>
    <way id="4002" version="2" changeset="6001">
      <tag k="highway" v="path"/>
      <tag k="surface" v="&lt; &amp; &quot; &apos; &gt;"/>
      <nd ref="3005"/>
      <nd ref="3006"/>
      <nd ref="3007"/>
      <nd ref="-3"/>
      <nd ref="3008"/>
      <nd ref="3009"/>
      <nd ref="3010"/>
    </way>
    <relation id="5001" version="4" changeset="6001">
      <tag k="name" v="Urban Route 15"/>
      <tag k="type" v="route"/>
      <member type="way" ref="4003" role="outer"/>
      <member type="way" ref="4004" role="inner"/>
    </relation>
  </modify>
  <delete if-unused="true">
    <node id="3011" version="2" changeset="6001" lat="-36.913179" lon="174.7204874">
      <tag k="addr:housenumber" v="3"/>
      <tag k="addr:street" v="Delaney Avenue"/>
    </node>
  </delete>
</osmChange>
`
    );
  });
});
