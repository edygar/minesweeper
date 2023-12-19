export type Pos = [row: number, col: number];
export type Tile = {
  state: "hidden" | "revealed" | "flagged";
  nearbyBombs: number;
  player?: number;
};
export type GameStatus = "idle" | "playing" | "won" | "lost";
export type GameMode = "multi-player" | "single-player";

export type GameState = {
  player: 0 | 1;
  mode: GameMode;
  level: number;
  status: GameStatus;
  bombsCountPlayer1: number;
  bombsCountPlayer2: number;
  tiles: Tile[][];
  bombs: Pos[];
  flagsCount: number;
  lastRevealed: Pos;
};
