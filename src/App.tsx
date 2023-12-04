import {
  Show,
  For,
  createEffect,
  batch,
  onCleanup,
  createSignal,
} from "solid-js";
import { createStore } from "solid-js/store";
import confetti from "canvas-confetti";

const INITIAL_FIELD_SIZE = 10;

type Pos = [number, number];
type GameState = {
  state: "playing" | "won" | "lost";
  field: number[][];
  bombs: Pos[];
  revealed: boolean[][];
  lastReveal?: Pos;
};

const LEVELS = [
  { label: "Easy", value: 10 },
  { label: "Medium", value: 15 },
  { label: "Hard", value: 20 },
  { label: "Expert", value: 30 },
];

const orthogonal = [
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, 0],
];

const diagonal = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const surroundings = [...orthogonal, ...diagonal];
const calcBombsPerSquare = (length: number) => length ** 2 / 10;

const createField = (length: number) => {
  const bombs: Pos[] = [];
  const bombsCount = calcBombsPerSquare(length);
  for (let i = 0; i < bombsCount; i++) {
    let bombRow: number, bombCol: number;
    do {
      [bombRow, bombCol] = [
        Math.floor(Math.random() * length),
        Math.floor(Math.random() * length),
      ];
    } while (bombs.find(([r, c]) => r === bombRow && c === bombCol));

    bombs.push([bombRow, bombCol]);
  }

  const field = Array.from({ length }, (_, row) =>
    Array.from({ length }, (__, col) =>
      bombs.reduce(
        (acc, [bombRow, bombCol]) =>
          acc +
          +(row === bombRow && bombCol === col ? Infinity : 0) +
          +surroundings.reduce(
            (acc, [surRow, surCol]) =>
              acc + +(row === bombRow + surRow && col === bombCol + surCol),
            0,
          ),
        0,
      ),
    ),
  );

  return {
    state: "playing",
    field,
    bombs,
    revealed: Array.from({ length }, () => Array.from({ length }, () => false)),
  } as const;
};

function App() {
  const [level, setLevel] = createSignal(INITIAL_FIELD_SIZE);
  const [game, update] = createStore<GameState>(
    createField(INITIAL_FIELD_SIZE),
  );

  createEffect(() => {
    if (game.state !== "playing") {
      return;
    }

    const won = game.revealed.every((cols, row) =>
      cols.every(
        (isRevealed, col) =>
          isRevealed || game.bombs.find(([r, c]) => r === row && c === col),
      ),
    );

    if (won) {
      update("state", "won");
    }
  });

  function reveal(row: number, col: number) {
    update("revealed", row, col, true);
    if (game.field[row][col] !== 0) {
      return;
    }

    for (const [surRow, surCol] of orthogonal) {
      if (
        surRow + row >= 0 &&
        surCol + col >= 0 &&
        surRow + row < game.field.length &&
        surCol + col < game.field.length &&
        !game.revealed[row + surRow][col + surCol]
      ) {
        const next = game.field[row + surRow][col + surCol];
        switch (next) {
          case 0:
            reveal(row + surRow, col + surCol);
            break;
          case Infinity:
            break;
          default:
            update("revealed", row + surRow, col + surCol, true);
        }
      }
    }
  }

  function play(row: number, col: number) {
    if (game.revealed[row][col]) {
      return;
    }

    batch(() => {
      update("lastReveal", [row, col]);

      if (game.field[row][col] === Infinity) {
        update("state", "lost");
        return;
      }

      reveal(row, col);
    });
  }

  let animationFrame: number;
  let confettiTimeout: ReturnType<typeof setTimeout>;
  createEffect(() => {
    if (game.state !== "won") return;

    const end = Date.now() + 1_000;
    function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        animationFrame = requestAnimationFrame(frame);
      }
    }
    confettiTimeout = setTimeout(frame, 500);
  });

  onCleanup(() => {
    cancelAnimationFrame(animationFrame);
    confetti.reset();
    clearTimeout(confettiTimeout);
  });

  return (
    <fieldset disabled={game.state !== "playing"}>
      <div class="absolute left-1 top-1 z-10 text-center">
        <select
          class="m-2 block rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
          onInput={({ target: { value } }) => {
            setLevel(parseInt(value));
            update(createField(parseInt(value)));
          }}
        >
          <For each={LEVELS}>
            {({ label, value }) => (
              <option value={value} selected={value === level()}>
                {label}
              </option>
            )}
          </For>
        </select>
        💣:
        {calcBombsPerSquare(game.field.length)}
      </div>
      <div class="relative flex h-[100dvh] w-[100dvw] items-center justify-center">
        <div
          class="grid aspect-square"
          style={{
            width: "min(100vw, 100vh)",
            "grid-template-columns": `repeat(${game.field.length}, 1fr)`,
          }}
        >
          <For each={game.field}>
            {(rows, row) => (
              <For each={rows}>
                {(state, col) => (
                  <button
                    onClick={() => play(row(), col())}
                    class="border font-bold"
                    style={{
                      "font-size": `min(calc(100% / ${length}vw), calc(100% / ${length}vh)))`,
                      "line-height": "0",
                      ...(game.revealed[row()][col()] ||
                      game.state !== "playing"
                        ? {
                            border: `1px solid #999`,
                            "background-color":
                              state === Infinity &&
                              game.lastReveal?.[0] === row() &&
                              game.lastReveal[1] === col()
                                ? "orangered"
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
                          }
                        : {
                            "background-color": "lightgray",
                            border: `3px outset`,
                            color: "transparent",
                          }),
                    }}
                  >
                    <svg viewBox="0 0 100 100">
                      <text
                        x="50%"
                        y="50%"
                        fill="currentColor"
                        dominant-baseline="middle"
                        text-anchor="middle"
                        font-size="50"
                      >
                        {state === Infinity
                          ? game.lastReveal?.[0] === row() &&
                            game.lastReveal[1] === col()
                            ? "💥"
                            : "💣"
                          : state === -1 || state === 0
                            ? ""
                            : state}
                      </text>
                    </svg>
                  </button>
                )}
              </For>
            )}
          </For>
        </div>

        <Show when={game.state !== "playing"}>
          <div
            class="absolute inset-0 grid h-full w-full animate-[1s_fade-in_500ms] place-content-center font-bold opacity-0"
            style={{ "animation-fill-mode": "forwards" }}
            onClick={() => {
              update(createField(game.field.length));
            }}
          >
            <div>
              <h1 class="my-3 text-center text-6xl text-white [text-shadow:_0_2px_5px_rgba(0,0,0,.5)]">
                You {game.state.replace(/^./, (c) => c.toUpperCase())}!
              </h1>
            </div>
          </div>
        </Show>
      </div>
    </fieldset>
  );
}

export default App;
