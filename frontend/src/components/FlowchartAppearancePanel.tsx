import type { DiagramStyle } from "../lib/mermaidTheme";

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: '"DM Sans", system-ui, sans-serif', label: "DM Sans" },
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "Georgia, serif", label: "Serif" },
  { value: "ui-monospace, monospace", label: "Monospace" },
];

type Props = {
  style: DiagramStyle;
  onChange: (patch: Partial<DiagramStyle>) => void;
  diagramTitle: string;
  onTitleChange: (v: string) => void;
};

export function FlowchartAppearancePanel({ style, onChange, diagramTitle, onTitleChange }: Props) {
  return (
    <div className="mb-4 space-y-4 rounded-xl border border-slate-700/60 bg-surface/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Flowchart look</p>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Diagram background
          <input
            type="color"
            value={style.diagramBg}
            onChange={(e) => onChange({ diagramBg: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-slate-600 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Diagram text
          <input
            type="color"
            value={style.diagramText}
            onChange={(e) => onChange({ diagramText: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-slate-600 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Font
          <select
            value={style.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="min-w-[10rem] rounded-lg border border-slate-600 bg-surface px-2 py-2 text-sm text-ink"
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[8rem] flex-col gap-1 text-xs text-ink-muted">
          Text size ({style.fontSizePx}px)
          <input
            type="range"
            min={10}
            max={24}
            value={style.fontSizePx}
            onChange={(e) => onChange({ fontSizePx: Number(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        Optional title (shown above the flowchart only if filled)
        <input
          type="text"
          value={diagramTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Order processing — leave empty to hide"
          className="rounded-lg border border-slate-600 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70"
        />
      </label>
    </div>
  );
}
