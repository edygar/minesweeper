import { Switch, Match } from "solid-js";

import redFlag from "./img/red-flag.png";
import greenFlag from "./img/green-flag.png";
import bomb from "./img/bomb.png";

export function TileSymbol(props: {
  symbol:
    | "hidden"
    | "bomb"
    | "redFlag"
    | "greenFlag"
    | number
    | "empty"
    | "flaggedBomb";
}) {
  return (
    <svg viewBox="0 0 100 100">
      <Switch>
        <Match when={props.symbol === "redFlag"}>
          <image
            href={redFlag}
            height="100"
            width="100"
            transform="scale(.6)"
            transform-origin="50% 50%"
          />
        </Match>
        <Match when={props.symbol === "greenFlag"}>
          <image
            href={greenFlag}
            height="100"
            width="100"
            transform="scale(.6)"
            transform-origin="50% 50%"
          />
        </Match>
        <Match when={props.symbol === "flaggedBomb"}>
          <image
            href={bomb}
            height="100"
            width="100"
            transform="scale(.4) translate(40 20)"
            transform-origin="50% 50%"
          />
          <image
            href={redFlag}
            height="100"
            width="100"
            transform="scale(.6)"
            transform-origin="50% 50%"
          />
        </Match>
        <Match when={props.symbol === "bomb"}>
          <image
            href={bomb}
            height="100"
            width="100"
            transform="scale(.6)"
            transform-origin="50% 50%"
          />
        </Match>
        <Match when={typeof props.symbol === "number"}>
          <text
            x="50%"
            y="50%"
            fill="currentColor"
            dominant-baseline="middle"
            text-anchor="middle"
            font-size="50"
          >
            {props.symbol}
          </text>
        </Match>
      </Switch>
    </svg>
  );
}
