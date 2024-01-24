export type BBox = readonly [
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
];

export type Tags = Record<string, string>;
