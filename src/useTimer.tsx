import { createEffect, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";

export function useTimer(running: () => boolean) {
  const [timer, updateTimer] = createStore<{
    start: null | Date;
    current: null | Date;
  }>({
    start: null,
    current: null,
  });

  let interval: ReturnType<typeof setInterval>;
  createEffect(() => {
    if (!running()) {
      clearInterval(interval);
      return;
    }

    const start = new Date();
    updateTimer({
      start,
      current: start,
    });

    interval = setInterval(() => {
      updateTimer("current", new Date());
    }, 1000);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  const formatter = new Intl.DateTimeFormat("en", {
    minute: "numeric",
    second: "numeric",
  });

  return () =>
    formatter.format(
      timer.current ? timer.current.getTime() - timer.start!.getTime() : 0,
    );
}
