import mermaid from "mermaid";
import { adjustHex, ensureHash, hexToRgbChannels, isDarkRgbChannels } from "./theme";

export type DiagramStyle = {
  diagramBg: string;
  diagramText: string;
  fontFamily: string;
  fontSizePx: number;
};

export const DEFAULT_DIAGRAM_STYLE: DiagramStyle = {
  diagramBg: "#1e293b",
  diagramText: "#e2e8f0",
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSizePx: 14,
};

export const DIAGRAM_STYLE_STORAGE_KEY = "sketch2flow-diagram-v1";

/** Mermaid config driven only by flowchart appearance (not app chrome). */
export function configureMermaidForDiagram(style: DiagramStyle): void {
  const bg = ensureHash(style.diagramBg);
  const tx = ensureHash(style.diagramText);
  const dark = isDarkRgbChannels(hexToRgbChannels(bg));

  const mainBkg = adjustHex(bg, dark ? 22 : -10);
  const secondary = adjustHex(bg, dark ? 12 : -6);
  const tertiary = adjustHex(bg, dark ? 32 : -14);
  const line = dark ? "#94a3b8" : "#64748b";

  const ff = style.fontFamily.replace(/"/g, "'").replace(/</g, "");
  const fs = Math.max(8, Math.min(32, style.fontSizePx));

  const themeCSS = `
#flowchart-root .mermaid .nodeLabel,
#flowchart-root .mermaid .edgeLabel,
#flowchart-root .mermaid span.edgeLabel,
#flowchart-root .mermaid .cluster text,
#flowchart-root .mermaid .nodeLabel text,
#flowchart-root .mermaid text.messageText,
#flowchart-root .mermaid .label text,
#flowchart-root .mermaid .label .foreignObject div {
  font-family: ${ff} !important;
  font-size: ${fs}px !important;
  color: ${tx} !important;
  fill: ${tx} !important;
}
`.trim();

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: ff,
    themeVariables: {
      darkMode: dark,
      background: bg,
      primaryColor: mainBkg,
      mainBkg,
      secondaryColor: secondary,
      tertiaryColor: tertiary,
      primaryTextColor: tx,
      secondaryTextColor: tx,
      lineColor: line,
      textColor: tx,
      fontSize: `${fs}px`,
      fontFamily: ff,
    },
    themeCSS,
  });
}
