import { XMLParser } from "fast-xml-parser";

/** @internal */
export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributesGroupName: "$",
  attributeNamePrefix: "",
  isArray: (tagName) => tagName !== "$",
});
