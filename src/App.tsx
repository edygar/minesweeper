import { Show, For, createEffect, batch, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { GameState } from "./types";
import { NEARBY_BOMBS_COLORS, INITIAL_FIELD_SIZE, LEVELS } from "./constants";
import { TileSymbol } from "./TileSymbol";
import { useConfettiOnVictory } from "./useConfettiOnVictory";
import { useTimer } from "./useTimer";
import { createGame, hasWon, navigateSafeSurroundings } from "./engine";

function App() {
  let container: HTMLDivElement | null = null;
  let longPress: ReturnType<typeof setTimeout> | boolean = false;

  const [game, update] = createStore<GameState>(createGame(INITIAL_FIELD_SIZE));

  const startNewGame = (level: number = game.level) =>
    update(createGame(level));

  const hasFinished = () => game.status !== "idle" && game.status !== "playing";
  useConfettiOnVictory(() => game.status === "won");
  const timer = useTimer(() => game.status === "playing");

  createEffect(() => {
    if (hasFinished()) {
      return;
    }

    if (hasWon(game)) {
      update("status", "won");
    }
  });

  function reveal(row: number, col: number) {
    batch(() => {
      if (game.status === "idle") {
        update("status", "playing");
      }

      if (game.tiles[row][col].state !== "hidden") {
        return;
      }

      update("lastRevealed", [row, col]);

      if (game.tiles[row][col].nearbyBombs === Infinity) {
        update("status", "lost");
        return;
      }

      navigateSafeSurroundings(game.tiles, row, col, (r, c) => {
        update("tiles", r, c, "state", "revealed");
      });
    });
  }

  function flag(row: number, col: number) {
    if (game.status === "idle") {
      update("status", "playing");
    }

    const tile = game.tiles[row][col];
    if (game.status === "won" || tile.state === "revealed") return;

    if (tile.state === "flagged") {
      update("tiles", row, col, "state", "hidden");
      update("flagsCount", (c) => c - 1);
    } else {
      update("tiles", row, col, "state", "flagged");
      update("flagsCount", (c) => c + 1);
    }
  }

  const moveFocus = (row: number, col: number) => {
    if (
      !container ||
      row < 0 ||
      col < 0 ||
      row >= game.level ||
      col >= game.level
    ) {
      return;
    }

    const button = (container as HTMLDivElement).childNodes[
      row * game.level + col
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

  return (
    <>
      <fieldset class="contents" disabled={hasFinished()}>
        <div class="m-auto flex items-stretch justify-between gap-5 p-2 portrait:w-[min(100dvh_-_3.5rem,100dvw)] landscape:flex-col landscape:items-start">
          <select
            class="appearance-none rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
            onInput={({ target: { value } }) => {
              startNewGame(parseInt(value));
            }}
          >
            <For each={LEVELS}>
              {({ label, value }) => (
                <option value={value} selected={value === game.level}>
                  {label}
                </option>
              )}
            </For>
          </select>
          <button
            onClick={() => startNewGame()}
            class="flex appearance-none gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500 active:bg-gray-100"
          >
            ↩<span class="portrait:hidden">Restart</span>
          </button>
          <ul class="flex gap-6 rounded-lg bg-gray-50 px-2 portrait:items-center landscape:flex-col ">
            <li>
              ⏹️ {game.level}x{game.level}
            </li>
            <li>💣 {game.bombs.length}</li>
            <li>🚩 {game.flagsCount}</li>
            <li>⏰ {timer()}</li>
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
              "grid-template-columns": `repeat(${game.level}, 1fr)`,
            }}
          >
            <For each={game.tiles}>
              {(rows, row) => (
                <For each={rows}>
                  {(tile, col) => {
                    const isLastRevealed = () =>
                      game.lastRevealed[0] === row() &&
                      game.lastRevealed[1] === col();

                    return (
                      <button
                        type="button"
                        onKeyDown={(e) => {
                          switch (e.key) {
                            case " ":
                              reveal(row(), col());
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
                          if (tile.state === "revealed") return;
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
                            return;
                          }
                          moveFocus(row(), col());
                          reveal(row(), col());
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!matchMedia("(pointer:fine)").matches) return;
                          flag(row(), col());
                        }}
                        class="border font-bold transition-transform duration-200"
                        style={{
                          ...(tile.state === "revealed" || hasFinished()
                            ? {
                                border: `1px solid #999`,
                                "background-color":
                                  tile.nearbyBombs === Infinity &&
                                  isLastRevealed()
                                    ? "orangered"
                                    : "darkgray",
                                color:
                                  tile.nearbyBombs in NEARBY_BOMBS_COLORS
                                    ? NEARBY_BOMBS_COLORS[
                                        tile.nearbyBombs as keyof typeof NEARBY_BOMBS_COLORS
                                      ]
                                    : "black",
                              }
                            : {
                                "background-color": "lightgray",
                                border: `3px outset`,
                              }),
                        }}
                      >
                        <TileSymbol
                          playing={!hasFinished()}
                          tile={tile}
                          isLastRevealed={isLastRevealed()}
                        />
                      </button>
                    );
                  }}
                </For>
              )}
            </For>
          </div>
        </div>
      </fieldset>
      <Show when={hasFinished()}>
        <button
          class="absolute inset-0 grid h-full w-full animate-[1s_fade-in_500ms] appearance-none place-content-center bg-none font-bold opacity-0"
          style={{ "animation-fill-mode": "forwards" }}
          ref={(el) => {
            onMount(() => {
              setTimeout(() => el.focus(), 1000);
            });
          }}
          onClick={() => {
            startNewGame();
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
