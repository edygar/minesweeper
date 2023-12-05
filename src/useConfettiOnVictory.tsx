import { createEffect, onCleanup } from "solid-js";
import confetti from "canvas-confetti";

export function useConfettiOnVictory(won: () => boolean) {
  let confettiTimeout: ReturnType<typeof setTimeout>;
  let animationFrame: number;

  createEffect(() => {
    if (!won()) return;

    const end = Date.now() + 1000;
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
    confetti.reset();
    cancelAnimationFrame(animationFrame);
    clearTimeout(confettiTimeout);
  });
}
