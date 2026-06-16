import { jsPDF } from "jspdf";
import { DIMS, DIM_DESC, type Vec } from "@/lib/amalgam/engine";

export type PdfSection = { heading?: string; subheading?: string; body?: string };

type Crystal = {
  vec: Vec;
  signature?: string;
  label?: string;        // e.g. claimant name
  accent?: [number, number, number]; // RGB for the polygon stroke/fill
};

type Options = {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  filename: string;
  crystal?: Crystal;          // single crystal (Rosetta)
  crystals?: Crystal[];       // multi crystal (Iso: A · third · B)
};

// UI tokens (dark theme — matches the app)
const BG: [number, number, number] = [6, 7, 9];          // --color-background
const PANEL: [number, number, number] = [12, 14, 18];    // --color-card
const FG: [number, number, number] = [240, 242, 245];    // --color-foreground
const MUTED: [number, number, number] = [142, 149, 162]; // --color-muted
const GOLD: [number, number, number] = [255, 207, 125];
const CYAN: [number, number, number] = [0, 245, 255];
const MAGENTA: [number, number, number] = [255, 0, 234];
const BORDER: [number, number, number] = [38, 42, 50];

export function downloadReportPdf({ title, subtitle, sections, filename, crystal, crystals }: Options) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  // paint full dark background helper for new pages
  const paintBg = () => {
    doc.setFillColor(...BG);
    doc.rect(0, 0, pageW, pageH, "F");
  };
  paintBg();

  const ensure = (need: number) => {
    if (y + need > pageH - margin - 24) { doc.addPage(); paintBg(); y = margin; }
  };

  const writeLines = (
    text: string,
    size: number,
    color: [number, number, number],
    gap = 4,
    style: "normal" | "bold" | "italic" = "normal",
  ) => {
    if (!text) return;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensure(size + gap);
      doc.text(line, margin, y);
      y += size + gap;
    }
  };

  // === Header band ===
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, pageW, 100, "F");
  // gold underline
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.75);
  doc.line(margin, 100, pageW - margin, 100);

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("1 + 1 = 3   ·   UNIVERSAL INTERPRETER", margin, 32);

  doc.setTextColor(...FG);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, margin, 60);

  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(subtitle, maxW), margin, 86);
  }
  y = 130;

  // === Crystal(s) of tension ===
  const list = crystals ?? (crystal ? [crystal] : []);
  if (list.length > 0) {
    const cellW = (maxW - 16 * (list.length - 1)) / list.length;
    const crystalH = Math.min(260, cellW + 60);
    ensure(crystalH + 8);
    for (let i = 0; i < list.length; i++) {
      const cx = margin + i * (cellW + 16);
      drawCrystal(doc, list[i], cx, y, cellW, crystalH);
    }
    y += crystalH + 16;
  }

  // === Sections ===
  for (const s of sections) {
    if (s.heading) {
      y += 10;
      ensure(28);
      // gold bar + heading
      doc.setFillColor(...GOLD);
      doc.rect(margin, y - 9, 3, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GOLD);
      doc.text(s.heading.toUpperCase(), margin + 10, y);
      y += 14;
    }
    if (s.subheading) {
      writeLines(s.subheading, 9, MUTED, 3, "italic");
      y += 2;
    }
    if (s.body) {
      writeLines(s.body, 10.5, FG, 5, "normal");
      y += 6;
    }
  }

  // === Footer on every page ===
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // footer line
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 32, pageW - margin, pageH - 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated ${new Date().toISOString().slice(0, 10)}   ·   t.me/Keiserdom`,
      margin, pageH - 18,
    );
    doc.setTextColor(...GOLD);
    doc.text(`${i} / ${pages}`, pageW - margin, pageH - 18, { align: "right" });
  }

  doc.save(filename);
}

// ---- Crystal of tension renderer (mirrors SignatureChart) ----
function drawCrystal(
  doc: jsPDF,
  c: Crystal,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const accent = c.accent ?? GOLD;
  // panel background
  doc.setFillColor(...PANEL);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 14, 14, "FD");

  // label (top-left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Σ  CRYSTAL OF TENSION", x + 12, y + 16);
  if (c.label) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...FG);
    doc.text(c.label, x + 12, y + 30);
  }

  // chart geometry
  const chartTop = y + 38;
  const chartH = h - 38 - (c.signature ? 28 : 12);
  const cx = x + w / 2;
  const cy = chartTop + chartH / 2;
  const r = Math.min(w, chartH) * 0.36;
  const n = DIMS.length;
  const ang = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, v: number): [number, number] => [
    cx + Math.cos(ang(i)) * r * v,
    cy + Math.sin(ang(i)) * r * v,
  ];

  // rings
  doc.setDrawColor(60, 64, 72);
  doc.setLineWidth(0.3);
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const poly = DIMS.map((_, j) => pt(j, f));
    drawPolygon(doc, poly, false);
  }
  // spokes
  for (let i = 0; i < n; i++) {
    const [px, py] = pt(i, 1);
    doc.line(cx, cy, px, py);
  }

  const sigPoly = DIMS.map((d, i) => pt(i, Math.max(0.04, c.vec[d])));

  // chromatic ghosts
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.4);
  drawPolygon(doc, sigPoly.map(([px, py]) => [px - 1.2, py] as [number, number]), false);
  doc.setDrawColor(...MAGENTA);
  drawPolygon(doc, sigPoly.map(([px, py]) => [px + 1.2, py] as [number, number]), false);

  // signature polygon
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.2);
  drawPolygonFilled(doc, sigPoly, 0.18);

  // labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (let i = 0; i < n; i++) {
    const a = ang(i);
    const lx = cx + Math.cos(a) * (r + 12);
    const ly = cy + Math.sin(a) * (r + 12) + 2;
    const hot = c.vec[DIMS[i]] > 0.45;
    if (hot) doc.setTextColor(...accent); else doc.setTextColor(...MUTED);
    doc.text(DIMS[i], lx, ly, { align: "center" });
  }

  // signature footer
  if (c.signature) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...accent);
    doc.text(c.signature, cx, y + h - 12, { align: "center" });
  }
}

function drawPolygon(doc: jsPDF, pts: [number, number][], close = true) {
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    if (!close && i === pts.length - 1) {
      doc.line(x1, y1, pts[0][0], pts[0][1]);
    } else {
      doc.line(x1, y1, x2, y2);
    }
  }
}

function drawPolygonFilled(doc: jsPDF, pts: [number, number][], opacity = 0.2) {
  // jsPDF lacks an easy polygon-fill helper; use lines() with the path
  const dx = pts[0][0];
  const dy = pts[0][1];
  const rel: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    rel.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  rel.push([pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]]);
  const g = doc.GState ? new doc.GState({ opacity }) : null;
  if (g) doc.setGState(g);
  doc.lines(rel, dx, dy, [1, 1], "FD", true);
  if (g) doc.setGState(new doc.GState({ opacity: 1 }));
}

// Helper for callers that need the full 11D readout as a text block
export function dimReadout(vec: Vec): string {
  return DIMS.map(d => {
    const pct = `${Math.round(vec[d] * 100)}%`.padStart(4);
    return `${d.padEnd(3)} ${DIM_DESC[d].padEnd(20)} ${pct}`;
  }).join("\n");
}
