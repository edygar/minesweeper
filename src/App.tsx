import {
  Show,
  For,
  createEffect,
  batch,
  onCleanup,
  createSignal,
  Switch,
  Match,
  onMount,
} from "solid-js";
import { createStore } from "solid-js/store";
import confetti from "canvas-confetti";

const INITIAL_FIELD_SIZE = 15;

type Pos = [number, number];
type TileState = "hidden" | "revealed" | "flagged";
type GameState = {
  status: "playing" | "won" | "lost";
  field: number[][];
  bombs: Pos[];
  state: TileState[][];
  lastReveal?: Pos;
  flagsCount: number;
  current: Date | null;
  start: Date | null;
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
const calcBombsPerSquare = (length: number) => Math.floor(length ** 2 / 10);

const createField = (length: number): GameState => {
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
    status: "playing",
    start: null,
    current: null,
    field,
    flagsCount: 0,
    bombs,
    state: Array.from({ length }, () => Array.from({ length }, () => "hidden")),
  } as const;
};

function App() {
  const [level, setLevel] = createSignal(INITIAL_FIELD_SIZE);
  const [game, update] = createStore<GameState>(
    createField(INITIAL_FIELD_SIZE),
  );

  createEffect(() => {
    if (game.status !== "playing") {
      return;
    }

    const won = game.state.every((cols, row) =>
      cols.every(
        (state, col) =>
          state === "revealed" ||
          game.bombs.find(([r, c]) => r === row && c === col),
      ),
    );

    if (won) {
      update("status", "won");
    }
  });

  function reveal(row: number, col: number) {
    update("state", row, col, "revealed");
    if (game.field[row][col] !== 0) {
      return;
    }

    for (const [surRow, surCol] of surroundings) {
      if (
        surRow + row >= 0 &&
        surCol + col >= 0 &&
        surRow + row < game.field.length &&
        surCol + col < game.field.length &&
        game.state[row + surRow][col + surCol] === "hidden"
      ) {
        const next = game.field[row + surRow][col + surCol];
        switch (next) {
          case 0:
            reveal(row + surRow, col + surCol);
            break;
          case Infinity:
            break;
          default:
            update("state", row + surRow, col + surCol, "revealed");
        }
      }
    }
  }

  function play(row: number, col: number) {
    if (game.start === null) {
      const start = new Date();
      update({ start, current: start });
    }

    if (game.state[row][col] !== "hidden") {
      return;
    }

    batch(() => {
      update("lastReveal", [row, col]);

      if (game.field[row][col] === Infinity) {
        update("status", "lost");
        return;
      }

      reveal(row, col);
    });
  }

  function flag(row: number, col: number) {
    const state = getState(row, col);
    if (game.status === "won" || state === "revealed") return;

    if (state === "flagged") {
      update("state", row, col, "hidden");
      update("flagsCount", (c) => c - 1);
      debugger;
    } else {
      update("state", row, col, "flagged");
      update("flagsCount", (c) => c + 1);
    }
  }

  let animationFrame: number;
  let confettiTimeout: ReturnType<typeof setTimeout>;
  createEffect(() => {
    if (game.status !== "won") return;

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

  const getState = (row: number, col: number) => game.state[row][col];

  let container: HTMLDivElement | null = null;
  const moveFocus = (row: number, col: number) => {
    if (
      !container ||
      row < 0 ||
      col < 0 ||
      row >= game.field.length ||
      col >= game.field.length
    ) {
      return;
    }

    const button = (container as HTMLDivElement).childNodes[
      row * game.field.length + col
    ];
    if (button) {
      (button as HTMLButtonElement).focus();
    }
  };

  onMount(() => {
    const startFocus = (e: Event & KeyboardEvent) => {
      if (document.activeElement === document.body && e.key !== "Tab")
        moveFocus(0, 0);
    };
    document.body.addEventListener("keydown", startFocus);
    onCleanup(() => document.body.removeEventListener("keydown", startFocus));
  });

  let interval: ReturnType<typeof setInterval>;
  createEffect(() => {
    if (game.status !== "playing" || game.start === null) {
      clearTimeout(interval);
      return;
    }

    interval = setInterval(() => {
      update("current", new Date());
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  const formatter = new Intl.DateTimeFormat("en", {
    minute: "numeric",
    second: "numeric",
  });

  let longPress: ReturnType<typeof setTimeout> | boolean = false;
  return (
    <>
      <fieldset class="contents" disabled={game.status !== "playing"}>
        <div class="m-auto flex h-14 items-center justify-between gap-5 p-2 text-center portrait:w-[min(100dvh_-_3.5rem,100dvw)] landscape:flex-col">
          <select
            class="h-10 appearance-none rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
            onInput={({ target: { value } }) => {
              setLevel(parseInt(value));
              update(createField(parseInt(value)));
            }}
          >
            <For each={LEVELS}>
              {({ label, value }) => (
                <option value={value} selected={value === level()}>
                  {label}: {value}x{value} ⏹️, {calcBombsPerSquare(value)} 💣
                </option>
              )}
            </For>
          </select>
          <ul class="grid h-10 grid-flow-col items-center gap-6 rounded-lg bg-gray-50 px-2">
            <li>🚩 {game.flagsCount}</li>
            <li>
              ⏰{" "}
              {game.start
                ? formatter.format(
                    new Date(game.current!.getTime() - game.start.getTime()),
                  )
                : "00:00"}
            </li>
          </ul>
        </div>
        <div class="m-auto flex flex-1 items-center justify-center portrait:w-[min(100dvh_-_3.5rem,100dvw)] landscape:h-[100dvh]">
          <div
            ref={(el) => {
              container = el;
            }}
            class="grid aspect-square"
            style={{
              width: "min(100vw, 100vh)",
              "grid-template-columns": `repeat(${game.field.length}, 1fr)`,
            }}
          >
            <For each={game.field}>
              {(rows, row) => (
                <For each={rows}>
                  {(nearbyBombs, col) => (
                    <button
                      type="button"
                      onKeyDown={(e) => {
                        switch (e.key) {
                          case " ":
                            play(row(), col());
                            break;
                          case "f":
                            flag(row(), col());
                            break;
                          case "ArrowUp":
                          case "k":
                            moveFocus(row() - 1, col());
                            break;
                          case "ArrowDown":
                          case "j":
                            moveFocus(row() + 1, col());
                            break;
                          case "ArrowLeft":
                          case "h":
                            moveFocus(row(), col() - 1);
                            break;
                          case "ArrowRight":
                          case "l":
                            moveFocus(row(), col() + 1);
                            break;
                          default:
                            return;
                        }
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        if (getState(row(), col()) === "revealed") return;
                        const { currentTarget } = e;
                        if (longPress !== false && longPress !== true)
                          clearTimeout(longPress);

                        longPress = setTimeout(() => {
                          flag(row(), col());
                          currentTarget.classList.add(
                            "scale-[5]",
                            "translate-y-[-300%]",
                          );
                          longPress = true;
                          setTimeout(() => {
                            currentTarget.classList.remove(
                              "scale-[5]",
                              "translate-y-[-300%]",
                            );
                          }, 250);
                        }, 250);
                      }}
                      onTouchEnd={() => {
                        if (longPress !== false && longPress !== true)
                          clearTimeout(longPress);
                      }}
                      onClick={() => {
                        if (longPress === true) {
                          longPress = false;
                          return
                        }
                        moveFocus(row(), col());
                        play(row(), col());
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!matchMedia("(pointer:fine)").matches) return;
                        flag(row(), col());
                      }}
                      class="border font-bold transition-transform duration-200"
                      style={{
                        "font-size": `min(calc(100% / ${length}vw), calc(100% / ${length}vh)))`,
                        "line-height": "0",
                        ...(getState(row(), col()) === "revealed" ||
                        game.status !== "playing"
                          ? {
                              border: `1px solid #999`,
                              "background-color":
                                nearbyBombs === Infinity &&
                                game.lastReveal?.[0] === row() &&
                                game.lastReveal[1] === col()
                                  ? "orangered"
                                  : "darkgray",
                              color: {
                                1: "blue",
                                2: "green",
                                3: "red",
                                4: "purple",
                                5: "maroon",
                                6: "turquoise",
                                7: "black",
                                8: "gray",
                              }[nearbyBombs],
                            }
                          : {
                              "background-color": "lightgray",
                              border: `3px outset`,
                            }),
                      }}
                    >
                      <svg viewBox="0 0 100 100">
                        {game.status !== "playing" &&
                          getState(row(), col()) === "flagged" && (
                            <text
                              x="50%"
                              y="50%"
                              fill="currentColor"
                              dominant-baseline="middle"
                              text-anchor="middle"
                              font-size="80"
                            >
                              🚩
                            </text>
                          )}
                        <text
                          x="50%"
                          y="50%"
                          fill="currentColor"
                          dominant-baseline="middle"
                          text-anchor="middle"
                          font-size="50"
                        >
                          <Switch fallback={nearbyBombs}>
                            <Match
                              when={
                                game.status === "playing" &&
                                getState(row(), col()) === "flagged"
                              }
                            >
                              🚩
                            </Match>
                            <Match
                              when={
                                (game.status === "playing" &&
                                  getState(row(), col()) === "hidden") ||
                                nearbyBombs === 0
                              }
                            >
                              {""}
                            </Match>
                            <Match when={nearbyBombs === Infinity}>
                              <Switch fallback="💣">
                                <Match
                                  when={
                                    game.lastReveal?.[0] === row() &&
                                    game.lastReveal[1] === col()
                                  }
                                >
                                  💥
                                </Match>
                                <Match
                                  when={getState(row(), col()) === "flagged"}
                                >
                                  💣
                                </Match>
                              </Switch>
                            </Match>
                          </Switch>
                        </text>
                      </svg>
                    </button>
                  )}
                </For>
              )}
            </For>
          </div>
        </div>
      </fieldset>
      <Show when={game.status !== "playing"}>
        <button
          class="absolute inset-0 grid h-full w-full animate-[1s_fade-in_500ms] appearance-none place-content-center bg-none font-bold opacity-0"
          style={{ "animation-fill-mode": "forwards" }}
          ref={(el) => {
            onMount(() => {
              setTimeout(() => el.focus(), 1000);
            });
          }}
          onClick={() => {
            update(createField(game.field.length));
          }}
        >
          <span class="my-3 text-center text-6xl text-white [text-shadow:_0_2px_5px_rgba(0,0,0,.5)]">
            You {game.status.replace(/^./, (c) => c.toUpperCase())}!
          </span>
        </button>
      </Show>
    </>
  );
}

export default App;
