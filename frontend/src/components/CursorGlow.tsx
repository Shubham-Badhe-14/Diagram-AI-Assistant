import { useEffect } from "react";

export function CursorGlow() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const onMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 motion-reduce:hidden"
      aria-hidden
      style={{
        background:
          "radial-gradient(420px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(129, 140, 248, 0.12), transparent 55%)",
      }}
    />
  );
}
