import { For } from "solid-js";
import { createStore } from "solid-js/store";

const INITIAL_FIELD_SIZE = 10;

type GameState = {
  field: number[][];
  bombs: number[][];
};

const createField = (length: number) => {
  const field = Array.from({ length: INITIAL_FIELD_SIZE }, () =>
    Array.from({ length }, () => -1),
  );

  const bombs: [row: number, col: number][] = [];

  return {
    field,
    bombs,
  };
};

const surroundings = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  // [0, 0],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function App() {
  const [game, update] = createStore<GameState>(
    createField(INITIAL_FIELD_SIZE),
  );

  function countBombsAround(row: number, col: number) {
    if (game.bombs.length === 0) {
      const { length } = game.field;
      update("bombs", new Array(length));

      for (let i = 0; i < length; i++) {
        let bombRow: number, bombCol: number;
        do {
          [bombRow, bombCol] = [
            Math.floor(Math.random() * length),
            Math.floor(Math.random() * length),
          ];
        } while (
          (bombRow === row && bombCol === col) ||
          game.bombs
            .slice(0, i)
            .find(([r, c]) => r === bombRow && c === bombCol)
        );

        update("bombs", i, [bombRow, bombCol]);
      }
    }

    const count = game.bombs.reduce(
      (acc, [bombRow, bombCol]) =>
        acc +
        +(row === bombRow && bombCol === col ? Infinity : 0) +
        +surroundings.reduce(
          (acc, [surRow, surCol]) =>
            acc + +(row === bombRow + surRow && col === bombCol + surCol),
          0,
        ),
      0,
    );
    update("field", row, col, count);

    if (count !== 0) return;
    for (const [surRow, surCol] of surroundings) {
      if (
        (surRow === 0 || surCol === 0) &&
        surRow + row >= 0 &&
        surCol + col >= 0 &&
        surRow + row < game.field.length &&
        surCol + col < game.field.length &&
        game.field[row + surRow][col + surCol] === -1
      ) {
        countBombsAround(row + surRow, col + surCol);
      }
    }
  }

  function onClick(row: number, col: number) {
    countBombsAround(row, col);
  }

  return (
    <div
      class="grid aspect-square h-screen"
      style={{ "grid-template-columns": `repeat(${game.field.length}, 1fr)` }}
    >
      <For each={game.field}>
        {(rows, row) => (
          <For each={rows}>
            {(state, col) => (
              <button
                onClick={() => onClick(row(), col())}
                class="cell border font-bold"
                style={{
                  "line-height": "0",
                  "background-color":
                    state === Infinity
                      ? "red"
                      : state === 0
                        ? "gray"
                        : "darkgray",
                  color: {
                    "-1": "black",
                    1: "blue",
                    2: "green",
                    3: "red",
                    4: "purple",
                    5: "maroon",
                    6: "turquoise",
                    7: "black",
                    8: "gray",
                  }[state],
                }}
              >
                {state === Infinity
                  ? "💣"
                  : state === -1 || state === 0
                    ? ""
                    : state}
              </button>
            )}
          </For>
        )}
      </For>
    </div>
  );
}

export default App;
