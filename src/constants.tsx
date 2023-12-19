export const INITIAL_FIELD_SIZE = 15;

export const MODES = [
  { label: "Multi Player", value: "multi-player" },
  { label: "Single player", value: "single-player" },
] as const;

export const LEVELS = [
  { label: "Easy", value: 10 },
  { label: "Medium", value: 15 },
  { label: "Hard", value: 20 },
  { label: "Expert", value: 30 },
];
const ORTHOGONAL = [
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, 0],
];
const DIAGONAL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
export const SURROUNDINGS = [...ORTHOGONAL, ...DIAGONAL];

export const NEARBY_BOMBS_COLORS = {
  1: "blue",
  2: "green",
  3: "red",
  4: "purple",
  5: "maroon",
  6: "turquoise",
  7: "black",
  8: "gray",
} as const;
