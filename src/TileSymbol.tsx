import { Switch, Match } from "solid-js";
import { Tile } from "./types";

export function TileSymbol(props: {
  playing: boolean;
  tile: Tile;
  isLastRevealed: boolean;
}) {
  return (
    <svg viewBox="0 0 100 100">
      {!props.playing && props.tile.state === "flagged" && (
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
        <Switch fallback={props.tile.nearbyBombs}>
          <Match when={props.playing && props.tile.state === "flagged"}>
            🚩
          </Match>
          <Match
            when={
              (props.playing && props.tile.state === "hidden") ||
              props.tile.nearbyBombs === 0
            }
          >
            {""}
          </Match>
          <Match when={props.tile.nearbyBombs === Infinity}>
            <Switch fallback="💣">
              <Match when={props.isLastRevealed}>💥</Match>
              <Match when={props.tile.state === "flagged"}>💣</Match>
            </Switch>
          </Match>
        </Switch>
      </text>
    </svg>
  );
}
