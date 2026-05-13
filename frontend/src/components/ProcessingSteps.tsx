const STEPS = [
  { id: "queued", label: "Queued", match: (s: string) => s === "queued" },
  {
    id: "run",
    label: "Pipeline",
    match: (s: string) =>
      s === "processing" ||
      s.startsWith("waiting_rate_limit") ||
      s === "processing_retrying",
  },
  {
    id: "done",
    label: "Finishing",
    match: (s: string) => s === "completed" || s === "completed_with_warnings",
  },
];

type Props = { status: string };

export function ProcessingSteps({ status }: Props) {
  const active = STEPS.findIndex((step) => step.match(status));
  const idx = active === -1 ? 1 : active;

  return (
    <div className="mx-auto mt-8 flex max-w-md justify-between gap-2">
      {STEPS.map((step, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "upcoming";
        return (
          <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                state === "done"
                  ? "border-emerald-500/80 bg-emerald-500/20 text-emerald-200"
                  : state === "active"
                    ? "border-accent bg-accent/30 text-ink shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                    : "border-slate-600 text-ink-muted"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </div>
            <span className="text-center text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
