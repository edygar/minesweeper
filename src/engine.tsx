import { GameState, Pos, Tile } from "./types";
import { SURROUNDINGS } from "./constants";

const calcBombsPerSquare = (length: number) => Math.floor(length ** 2 / 10);
export const createGame = (
  level: number,
  mode: GameState["mode"],
): GameState => {
  const bombs: Pos[] = [];
  const bombsCount = calcBombsPerSquare(level);
  for (let i = 0; i < bombsCount; i++) {
    let bombRow: number, bombCol: number;
    do {
      [bombRow, bombCol] = [
        Math.floor(Math.random() * level),
        Math.floor(Math.random() * level),
      ];
    } while (bombs.find(([r, c]) => r === bombRow && c === bombCol));

    bombs.push([bombRow, bombCol]);
  }

  const tiles: Tile[][] = Array.from({ length: level }, (_, row) =>
    Array.from({ length: level }, (__, col) => ({
      state: "hidden",
      nearbyBombs: countNearbyBombs(bombs, row, col),
    })),
  );

  return {
    level,
    mode,
    player: 0,
    status: "idle",
    tiles,
    flagsCount: 0,
    lastRevealed: [-1, -1],
    bombs,

    bombsCountPlayer1: 0,
    bombsCountPlayer2: 0,
  } as const;
};
function countNearbyBombs(bombs: Pos[], row: number, col: number): number {
  return bombs.reduce(
    (acc, [bombRow, bombCol]) =>
      acc +
      +(row === bombRow && bombCol === col ? Infinity : 0) +
      +SURROUNDINGS.reduce(
        (acc, [surRow, surCol]) =>
          acc + +(row === bombRow + surRow && col === bombCol + surCol),
        0,
      ),
    0,
  );
}
export function navigateSafeSurroundings(
  tiles: GameState["tiles"],
  row: number,
  col: number,
  fn: (r: number, c: number) => void,
) {
  fn(row, col);
  if (tiles[row][col].nearbyBombs !== 0) {
    return;
  }

  for (const [surRow, surCol] of SURROUNDINGS) {
    if (
      surRow + row >= 0 &&
      surCol + col >= 0 &&
      surRow + row < tiles.length &&
      surCol + col < tiles.length &&
      tiles[row + surRow][col + surCol].state === "hidden"
    ) {
      switch (tiles[row + surRow][col + surCol].nearbyBombs) {
        case 0:
          navigateSafeSurroundings(tiles, row + surRow, col + surCol, fn);
          break;
        case Infinity:
          break;
        default:
          fn(row + surRow, col + surCol);
      }
    }
  }
}
export function hasWon(game: GameState) {
  if (game.mode === "single-player") {
    return game.tiles.every((cols, row) =>
      cols.every(
        ({ state }, col) =>
          state === "revealed" ||
          game.bombs.find(([r, c]) => r === row && c === col),
      ),
    );
  }

  return game.bombs.every(
    ([row, col]) => game.tiles[row][col].state === "revealed",
  );
}
