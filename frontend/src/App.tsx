import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import mermaid from "mermaid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiBase,
  fetchMermaid,
  fetchStatus,
  postReimagine,
  serverPngUrl,
  startProcess,
  uploadImage,
  type JobArtifacts,
} from "./api/client";
import { AmbientBackground } from "./components/AmbientBackground";
import { CursorGlow } from "./components/CursorGlow";
import { ExportOptions } from "./components/ExportOptions";
import { FlowchartAppearancePanel } from "./components/FlowchartAppearancePanel";
import { ProcessingSteps } from "./components/ProcessingSteps";
import {
  DEFAULT_DIAGRAM_STYLE,
  DIAGRAM_STYLE_STORAGE_KEY,
  configureMermaidForDiagram,
  type DiagramStyle,
} from "./lib/mermaidTheme";
import { ensureHash } from "./lib/theme";

function toggleFlowchartOrientation(code: string): string {
  if (code.includes("flowchart TD")) {
    return code.replace("flowchart TD", "flowchart LR");
  }
  if (code.includes("flowchart LR")) {
    return code.replace("flowchart LR", "flowchart TD");
  }
  return `flowchart LR\n${code}`;
}

async function renderMermaidInto(
  container: HTMLDivElement,
  code: string,
  style: DiagramStyle,
): Promise<void> {
  configureMermaidForDiagram(style);
  container.innerHTML = "";
  if (!code.trim()) return;
  const graph = document.createElement("pre");
  graph.className = "mermaid";
  graph.id = `m-${Date.now()}`;
  graph.textContent = code;
  container.appendChild(graph);
  await mermaid.run({ nodes: [graph] });
  const svg = graph.querySelector("svg");
  if (svg) {
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.maxWidth = "100%";
  }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadFlowchartRaster(
  svg: SVGElement,
  baseName: string,
  opts: {
    format: "png" | "jpeg";
    fill: string;
    quality?: number;
    title?: string;
    titleFont: string;
    titleSizePx: number;
    titleColor: string;
  },
) {
  const scale = 2;
  const pad = 14 * scale;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const bbox = svg.getBoundingClientRect();
  const svgW = Math.max(bbox.width * scale, 1);
  const svgH = Math.max(bbox.height * scale, 1);

  const titleText = opts.title?.trim() ?? "";
  const titleBlockH = titleText ? opts.titleSizePx * scale * 1.55 : 0;

  const cw = Math.max(svgW + pad * 2, 320);
  const ch = pad + (titleText ? titleBlockH + pad * 0.75 : 0) + svgH + pad;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = opts.fill;
  ctx.fillRect(0, 0, cw, ch);

  let y = pad;
  if (titleText) {
    ctx.fillStyle = opts.titleColor;
    ctx.font = `600 ${opts.titleSizePx * scale}px ${opts.titleFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(titleText, cw / 2, y);
    y += titleBlockH + pad * 0.5;
  }

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, (cw - svgW) / 2, y, svgW, svgH);
    const a = document.createElement("a");
    const ext = opts.format === "jpeg" ? "jpg" : "png";
    a.download = `${baseName}.${ext}`;
    a.href =
      opts.format === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", opts.quality ?? 0.92);
    a.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(source)));
}

type Phase = "upload" | "processing" | "result";

const pageTransition = {
  initial: { opacity: 0, y: 18, filter: "blur(8px)" as const },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" as const },
  exit: { opacity: 0, y: -12, filter: "blur(6px)" as const },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function App() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");
  const [statusLine, setStatusLine] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState("queued");
  const [error, setError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<JobArtifacts | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const [diagramStyle, setDiagramStyle] = useState<DiagramStyle>(DEFAULT_DIAGRAM_STYLE);
  const [diagramTitle, setDiagramTitle] = useState("");
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
  const [exportLightBg, setExportLightBg] = useState(false);

  const diagramHost = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DIAGRAM_STYLE_STORAGE_KEY);
      if (!raw) return;
      const x = JSON.parse(raw) as {
        diagramStyle?: DiagramStyle;
        diagramTitle?: string;
      };
      if (x.diagramStyle) {
        setDiagramStyle({ ...DEFAULT_DIAGRAM_STYLE, ...x.diagramStyle });
      }
      if (typeof x.diagramTitle === "string") {
        setDiagramTitle(x.diagramTitle);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DIAGRAM_STYLE_STORAGE_KEY,
      JSON.stringify({ diagramStyle, diagramTitle }),
    );
  }, [diagramStyle, diagramTitle]);

  const diagramStyleKey = useMemo(() => JSON.stringify(diagramStyle), [diagramStyle]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedCode(mermaidCode), 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mermaidCode]);

  useEffect(() => {
    const el = diagramHost.current;
    if (!el || phase !== "result") return;
    let cancelled = false;
    void (async () => {
      try {
        await renderMermaidInto(el, debouncedCode, diagramStyle);
      } catch {
        if (!cancelled) {
          el.innerHTML =
            '<p class="text-rose-400 text-sm p-4">Could not render this Mermaid. Check syntax.</p>';
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCode, phase, diagramStyleKey]);

  const exportCanvasFill = useMemo(
    () => (exportLightBg ? "#ffffff" : ensureHash(diagramStyle.diagramBg)),
    [exportLightBg, diagramStyle.diagramBg],
  );

  const runMutation = useMutation({
    mutationFn: async (f: File) => {
      setError(null);
      setArtifacts(null);
      setPhase("processing");
      setPipelineStatus("queued");
      setStatusLine("Uploading image…");
      const { job_id } = await uploadImage(f);
      setJobId(job_id);
      setPipelineStatus("queued");
      setStatusLine("Starting pipeline…");
      await startProcess(job_id);

      for (let i = 0; i < 120; i++) {
        const data = await fetchStatus(job_id);
        setPipelineStatus(data.status);
        const human = data.status.replace(/_/g, " ");
        setStatusLine(`Status: ${human}`);
        if (data.artifacts) {
          setArtifacts(data.artifacts);
        }

        if (data.status === "completed" || data.status === "completed_with_warnings") {
          const mmd = await fetchMermaid(job_id);
          setMermaidCode(mmd);
          setDebouncedCode(mmd);
          setPhase("result");
          return { job_id, status: data.status };
        }
        if (data.status.startsWith("failed")) {
          throw new Error(data.status);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Processing timed out after 120s.");
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("upload");
    },
  });

  const reimagineMutation = useMutation({
    mutationFn: async ({ jobId: jid, mermaid: mmd }: { jobId: string; mermaid: string }) => {
      setError(null);
      const out = await postReimagine(jid, mmd);
      setMermaidCode(out.mermaid);
      setDebouncedCode(out.mermaid);
      return out;
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && file && phase === "upload") {
        e.preventDefault();
        if (!runMutation.isPending) void runMutation.mutateAsync(file);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, phase, runMutation]);

  const onPickFile = useCallback((f: File | null) => {
    if (!f || !f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setJobId(null);
    setMermaidCode("");
    setDebouncedCode("");
    setPhase("upload");
    setError(null);
    setStatusLine("");
    setArtifacts(null);
    setPipelineStatus("queued");
    if (diagramHost.current) diagramHost.current.innerHTML = "";
  }, [previewUrl]);

  const onRotateLayout = () => {
    setMermaidCode((c) => toggleFlowchartOrientation(c));
  };

  const onDownloadRaster = () => {
    const svg = diagramHost.current?.querySelector("svg");
    if (!svg) {
      setError("No diagram to export yet.");
      return;
    }
    downloadFlowchartRaster(svg, `flowchart-${jobId ?? "export"}`, {
      format: exportFormat,
      fill: exportCanvasFill,
      quality: 0.92,
      title: diagramTitle.trim() || undefined,
      titleFont: diagramStyle.fontFamily,
      titleSizePx: Math.min(22, diagramStyle.fontSizePx + 4),
      titleColor: ensureHash(diagramStyle.diagramText),
    });
  };

  const onCopyMermaid = async () => {
    if (!mermaidCode.trim()) return;
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const patchDiagramStyle = useCallback((patch: Partial<DiagramStyle>) => {
    setDiagramStyle((prev) => ({ ...prev, ...patch }));
  }, []);

  const titleTrimmed = diagramTitle.trim();

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      <CursorGlow />

      <div className="relative z-0 mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <motion.header
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Sketch2Flow
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Hand-drawn diagrams →{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              Mermaid flowcharts
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-muted">
            Upload a sketch, run the vision pipeline, then refine the generated Mermaid live.
          </p>
        </motion.header>

        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {phase === "upload" && (
            <motion.section
              key="upload"
              {...pageTransition}
              className="mt-8 rounded-2xl bg-surface-muted/80 p-8 shadow-panel backdrop-blur-sm sm:p-10"
            >
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition focus-within:ring-2 focus-within:ring-accent ${
                  dragOver
                    ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                    : "border-slate-600/80 bg-surface/50 hover:border-accent hover:bg-surface-muted/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  onPickFile(f ?? null);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-lg font-medium text-ink">Drop an image here</span>
                <span className="mt-2 text-sm text-ink-muted">or click to browse</span>
                <span className="mt-3 text-xs text-ink-muted/80">Ctrl+Enter converts when a file is selected</span>
              </label>

              {previewUrl && file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                  className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center"
                >
                  <img
                    src={previewUrl}
                    alt="Selected sketch preview"
                    className="max-h-64 rounded-lg border border-slate-700/80 object-contain shadow-lg"
                  />
                  <div className="flex flex-col gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                      disabled={runMutation.isPending}
                      onClick={() => void runMutation.mutateAsync(file)}
                    >
                      Convert to flowchart
                    </motion.button>
                    <button
                      type="button"
                      className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                      onClick={reset}
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.section>
          )}

          {phase === "processing" && (
            <motion.section
              key="processing"
              {...pageTransition}
              className="mt-8 rounded-2xl bg-surface-muted/80 p-12 text-center shadow-panel backdrop-blur-sm"
            >
              <motion.div
                className="mx-auto mb-6 h-12 w-12 rounded-full border-2 border-slate-600 border-t-accent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                aria-hidden
              />
              <h2 className="text-xl font-semibold text-ink">Working on your diagram</h2>
              <p className="mt-3 text-sm text-ink-muted">{statusLine}</p>
              <ProcessingSteps status={pipelineStatus} />
              <p className="mt-6 text-xs text-ink-muted/80">
                This may take up to a minute when OCR is enabled on first run.
              </p>
            </motion.section>
          )}

          {phase === "result" && (
            <motion.div key="result" {...pageTransition} className="mt-8 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Result</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <ExportOptions
                    exportFormat={exportFormat}
                    onExportFormat={setExportFormat}
                    exportLightBg={exportLightBg}
                    onExportLightBg={setExportLightBg}
                  />
                  {artifacts?.server_png === true && jobId && (
                    <a
                      href={serverPngUrl(jobId)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-600 bg-surface-muted px-3 py-2 text-xs font-medium text-ink-muted transition hover:border-accent hover:text-ink"
                    >
                      Server PNG
                    </a>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg border border-slate-600 bg-surface-muted px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
                    onClick={onDownloadRaster}
                  >
                    Download {exportFormat === "jpeg" ? "JPEG" : "PNG"}
                  </motion.button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 bg-surface-muted px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
                    onClick={() => downloadText(`diagram-${jobId ?? "export"}.mmd`, mermaidCode)}
                  >
                    Download .mmd
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 bg-surface-muted px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
                    onClick={onCopyMermaid}
                  >
                    {copyDone ? "Copied" : "Copy Mermaid"}
                  </button>
                  {jobId && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={reimagineMutation.isPending}
                      className="rounded-lg border border-violet-500/50 bg-violet-950/40 px-3 py-2 text-xs font-medium text-violet-100 transition hover:border-violet-400 disabled:opacity-50"
                      onClick={() =>
                        void reimagineMutation.mutateAsync({ jobId, mermaid: mermaidCode })
                      }
                    >
                      {reimagineMutation.isPending ? "Reimagining…" : "Reimagine with AI"}
                    </motion.button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 bg-surface-muted px-3 py-2 text-xs font-medium text-ink transition hover:border-accent"
                    onClick={onRotateLayout}
                  >
                    Toggle TD / LR
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
                    onClick={reset}
                  >
                    New diagram
                  </motion.button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-slate-700/60 bg-surface-muted/60 p-4 shadow-panel"
                >
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Source
                  </h3>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Original upload"
                      className="mx-auto max-h-[420px] rounded-lg object-contain"
                    />
                  ) : null}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-slate-700/60 bg-surface-muted/60 p-4 shadow-panel"
                >
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Flowchart
                  </h3>
                  <FlowchartAppearancePanel
                    style={diagramStyle}
                    onChange={patchDiagramStyle}
                    diagramTitle={diagramTitle}
                    onTitleChange={setDiagramTitle}
                  />
                  <div
                    id="flowchart-root"
                    className="overflow-x-auto rounded-lg p-3"
                    style={{ backgroundColor: ensureHash(diagramStyle.diagramBg) }}
                  >
                    {titleTrimmed ? (
                      <div
                        className="mb-3 rounded-lg border border-white/10 px-3 py-2 text-center text-base font-semibold shadow-sm"
                        style={{
                          color: ensureHash(diagramStyle.diagramText),
                          fontFamily: diagramStyle.fontFamily,
                        }}
                      >
                        {titleTrimmed}
                      </div>
                    ) : null}
                    <div ref={diagramHost} className="min-h-[280px]" />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="rounded-2xl border border-slate-700/60 bg-surface-muted/60 p-5 shadow-panel"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Mermaid source
                </h3>
                <textarea
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  spellCheck={false}
                  className="font-mono h-56 w-full resize-y rounded-lg border border-slate-700 bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  aria-label="Mermaid diagram source code"
                />
                <p className="mt-2 text-xs text-ink-muted">
                  Edits debounce and re-render above. API base:{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-ink-muted">
                    {apiBase() || "(same origin)"}
                  </code>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
