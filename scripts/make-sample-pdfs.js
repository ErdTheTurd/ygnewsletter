const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "issues");
fs.mkdirSync(OUT, { recursive: true });

function pdfFor(title, subtitle, filename) {
  // Minimal one-page PDF with text via Helvetica
  const lines = [
    "BT",
    "/F1 28 Tf",
    "50 720 Td",
    `(${title.replace(/[()\\]/g, "")}) Tj`,
    "0 -36 Td",
    "/F1 14 Tf",
    `(${subtitle.replace(/[()\\]/g, "")}) Tj`,
    "0 -28 Td",
    "(Immaculate Conception Church, FSSP) Tj",
    "0 -20 Td",
    "(El Paso, Texas) Tj",
    "0 -40 Td",
    "/F1 11 Tf",
    "(Sample issue for the EP Newsletter archive.) Tj",
    "0 -18 Td",
    "(Replace this file with a real newsletter PDF.) Tj",
    "ET",
  ].join("\n");

  const stream = lines;
  const objects = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
  );
  objects.push(
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF\n`;

  fs.writeFileSync(path.join(OUT, filename), pdf);
}

pdfFor("EP Newsletter", "Sample Issue: Ordinary Time", "2026-09-07.pdf");
pdfFor("EP Newsletter", "Sample Issue: Exaltation of the Cross", "2026-09-14.pdf");
pdfFor("EP Newsletter", "Sample Issue: St. Michael", "2026-09-28.pdf");

// Simple SVG covers rendered as placeholder PNGs aren't trivial without deps;
// write SVG covers the site can use.
function svgCover(label, file) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#152238"/>
      <stop offset="100%" stop-color="#3d2a22"/>
    </linearGradient>
  </defs>
  <rect width="480" height="640" fill="url(#g)"/>
  <rect x="28" y="28" width="424" height="584" fill="none" stroke="#b8973a" stroke-width="2"/>
  <text x="240" y="220" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#e8e0d4">EP</text>
  <text x="240" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#b8973a">NEWSLETTER</text>
  <text x="240" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#c9b8a8">${label}</text>
  <text x="240" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#8a7a6a">Immaculate Conception · El Paso</text>
</svg>`;
  fs.writeFileSync(path.join(OUT, file), svg);
}

svgCover("7 September 2026", "2026-09-07.svg");
svgCover("14 September 2026", "2026-09-14.svg");
svgCover("28 September 2026", "2026-09-28.svg");

console.log("Sample PDFs and covers written to issues/");
