type Props = {
  exportFormat: "png" | "jpeg";
  onExportFormat: (f: "png" | "jpeg") => void;
  exportLightBg: boolean;
  onExportLightBg: (v: boolean) => void;
};

export function ExportOptions({
  exportFormat,
  onExportFormat,
  exportLightBg,
  onExportLightBg,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/60 bg-surface-muted/50 px-3 py-2 text-xs shadow-panel">
      <span className="font-semibold uppercase tracking-wider text-ink-muted">Export</span>
      <div className="flex rounded-lg border border-slate-600 p-0.5">
        {(["png", "jpeg"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onExportFormat(f)}
            className={`rounded-md px-2.5 py-1 font-medium uppercase ${
              exportFormat === f ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-ink-muted">
        <input
          type="checkbox"
          checked={exportLightBg}
          onChange={(e) => onExportLightBg(e.target.checked)}
          className="rounded border-slate-500"
        />
        Light canvas
      </label>
    </div>
  );
}
