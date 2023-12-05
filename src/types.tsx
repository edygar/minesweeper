export type Pos = [number, number];
export type Tile = {
  state: "hidden" | "revealed" | "flagged";
  nearbyBombs: number;
};
export type GameStatus = "idle" | "playing" | "won" | "lost";
export type GameState = {
  level: number;
  status: GameStatus;
  tiles: Tile[][];
  bombs: Pos[];
  flagsCount: number;
  lastRevealed: Pos;
};
