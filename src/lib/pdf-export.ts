import { jsPDF } from "jspdf";

export type PdfSection = { heading?: string; subheading?: string; body?: string };

type Options = {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  filename: string;
};

export function downloadReportPdf({ title, subtitle, sections, filename }: Options) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (need: number) => {
    if (y + need > pageH - margin) { doc.addPage(); y = margin; }
  };

  const writeLines = (text: string, size: number, color: [number, number, number], gap = 4, style: "normal" | "bold" | "italic" = "normal") => {
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

  // Header band
  doc.setFillColor(15, 18, 28);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 207, 125);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1 + 1 = 3  ·  UNIVERSAL INTERPRETER", margin, 36);
  doc.setTextColor(245, 245, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(doc.splitTextToSize(title, maxW), margin, 62);
  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 210);
    doc.text(doc.splitTextToSize(subtitle, maxW), margin, 80);
  }
  y = 120;

  for (const s of sections) {
    if (s.heading) {
      ensure(28);
      y += 6;
      writeLines(s.heading.toUpperCase(), 11, [255, 207, 125], 4, "bold");
    }
    if (s.subheading) writeLines(s.subheading, 9, [140, 140, 150], 3, "italic");
    if (s.body) {
      y += 2;
      writeLines(s.body, 11, [30, 30, 40], 5, "normal");
      y += 6;
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(`Generated ${new Date().toISOString().slice(0, 10)}  ·  t.me/Keiserdom`, margin, pageH - 20);
    doc.text(`${i} / ${pages}`, pageW - margin, pageH - 20, { align: "right" });
  }

  doc.save(filename);
}

