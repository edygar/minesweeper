import greenFlag from "./img/green-flag.png";
import redFlag from "./img/red-flag.png";
import bomb from "./img/bomb.png";
import greenBg from "./img/green.png";
import orangeBg from "./img/orange.png";
import redBg from "./img/red.png";

import { Show, For, createEffect, batch, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { GameState, Tile } from "./types";
import {
  NEARBY_BOMBS_COLORS,
  INITIAL_FIELD_SIZE,
  LEVELS,
  MODES,
} from "./constants";
import { TileSymbol } from "./TileSymbol";
import { useConfettiOnVictory } from "./useConfettiOnVictory";
import { useTimer } from "./useTimer";
import { url, createGame, hasWon, navigateSafeSurroundings } from "./engine";

function App() {
  let container: HTMLFieldSetElement | null = null;
  let longPress: ReturnType<typeof setTimeout> | boolean = false;

  const [game, update] = createStore<GameState>(
    createGame(INITIAL_FIELD_SIZE, "single-player"),
  );

  const startNewGame = (
    level: number = game.level,
    mode: GameState["mode"] = game.mode,
  ) => update(createGame(level, mode));

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
        if (game.mode === "single-player") {
          update("status", "lost");
        } else {
          update("tiles", row, col, "state", "revealed");
          update("tiles", row, col, "player", game.player);
          update(
            game.player === 0 ? "bombsCountPlayer1" : "bombsCountPlayer2",
            (bombs) => bombs + 1,
          );
        }
        return;
      }

      if (game.mode === "multi-player") {
        update("player", (player) => (player === 1 ? 0 : 1));
      }
      navigateSafeSurroundings(game.tiles, row, col, (r, c) => {
        update("tiles", r, c, "state", "revealed");
      });
    });
  }

  function flag(row: number, col: number) {
    if (game.mode === "multi-player") return;
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

    const button = container.childNodes[row * game.level + col];
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

  function getSymbol(tile: Tile) {
    if (game.status === "playing" || game.status === "idle") {
      if (tile.state === "revealed") {
        switch (tile.nearbyBombs) {
          case 0:
            return "empty";
          case Infinity:
            return game.mode === "multi-player"
              ? tile.player === 0
                ? "redFlag"
                : "greenFlag"
              : "bomb";
          default:
            return tile.nearbyBombs;
        }
      } else if (tile.state === "flagged") {
        return "redFlag";
      }

      return "hidden";
    }

    if (tile.nearbyBombs === Infinity) {
      if (tile.state === "flagged") {
        return "flaggedBomb";
      }

      return game.mode === "multi-player"
        ? tile.player === 1
          ? "greenFlag"
          : "redFlag"
        : "bomb";
    }

    if (tile.nearbyBombs === 0) {
      return "empty";
    }
    return tile.nearbyBombs;
  }

  return (
    <>
      <div class="contents">
        <fieldset
          disabled={hasFinished()}
          class="m-auto flex flex-wrap items-stretch justify-center gap-5 overflow-auto p-2 portrait:w-[min(100dvh_-_3.5rem,100dvw)] landscape:flex-col landscape:items-start"
        >
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
          <select
            class="appearance-none rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500"
            onInput={({ target: { value } }) => {
              startNewGame(game.level, value as GameState["mode"]);
            }}
          >
            <For each={MODES}>
              {({ label, value }) => (
                <option value={value} selected={value === game.mode}>
                  {label}
                </option>
              )}
            </For>
          </select>
          <Show when={game.mode === "multi-player"}>
            <div class="flex appearance-none gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500 active:bg-gray-100">
              Turn:{" "}
              <img
                class="h-[1.5em] w-[1.5em] object-cover"
                src={game.player === 1 ? greenFlag : redFlag}
                alt=""
              />
            </div>
          </Show>
          <button
            onClick={() => startNewGame()}
            class="flex appearance-none gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-gray-500 focus:ring-gray-500 active:bg-gray-100"
          >
            ↩<span class="portrait:hidden">Restart</span>
          </button>
          <ul class="flex gap-6 rounded-lg bg-gray-50 p-2 portrait:items-center landscape:flex-col ">
            <li>
              <img src={bomb} class="inline-block h-[1.5em]" />{" "}
              {game.bombs.length}
            </li>
            <Show
              when={game.mode === "multi-player"}
              fallback={
                <li>
                  <img src={redFlag} class="inline-block h-[1.5em]" />{" "}
                  {game.flagsCount}
                </li>
              }
            >
              <li>
                <img src={redFlag} class="inline-block h-[1.5em]" />{" "}
                {game.bombsCountPlayer1}
              </li>
              <li>
                <img src={greenFlag} class="inline-block h-[1.5em]" />{" "}
                {game.bombsCountPlayer2}
              </li>
            </Show>
            <li>⏰ {timer()}</li>
          </ul>
        </fieldset>
        <div class="m-auto flex flex-1 items-center justify-center overflow-auto portrait:w-[min(100dvh_-_3.5rem,100dvw)] landscape:h-[100dvh]">
          <fieldset
            ref={(el) => {
              container = el;
            }}
            disabled={hasFinished()}
            class="grid aspect-square"
            style={{
              width: "min(100vw, 100vh)",
              "min-width": 3 * game.level + "rem",
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
                          if (
                            tile.state === "revealed" ||
                            game.mode === "multi-player"
                          )
                            return;
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
                        class="aspect-square bg-cover bg-center font-bold transition-transform duration-200"
                        style={{
                          ...(tile.state === "revealed" || hasFinished()
                            ? {
                                "background-image":
                                  tile.nearbyBombs === Infinity &&
                                  game.mode === "single-player" &&
                                  isLastRevealed()
                                    ? url(redBg)
                                    : tile.state === "revealed" ||
                                        tile.nearbyBombs === 0
                                      ? url(greenBg)
                                      : url(orangeBg),
                                color:
                                  tile.nearbyBombs in NEARBY_BOMBS_COLORS
                                    ? NEARBY_BOMBS_COLORS[
                                        tile.nearbyBombs as keyof typeof NEARBY_BOMBS_COLORS
                                      ]
                                    : "black",
                              }
                            : {
                                "background-image": url(orangeBg),
                              }),
                        }}
                      >
                        <TileSymbol symbol={getSymbol(tile)} />
                      </button>
                    );
                  }}
                </For>
              )}
            </For>
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
                {game.mode === "multi-player" ? (
                  <img
                    class="inline-block h-[2em] w-[2em] object-contain"
                    src={
                      game.bombsCountPlayer1 > game.bombsCountPlayer2
                        ? redFlag
                        : greenFlag
                    }
                    alt=""
                  />
                ) : (
                  "You"
                )}{" "}
                {game.status.replace(/^./, (c) => c.toUpperCase())}!
              </span>
            </button>
          </Show>
        </div>
      </div>
    </>
  );
}

export default App;
