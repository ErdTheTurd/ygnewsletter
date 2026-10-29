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

pdfFor("EP Newsletter", "Sample Issue: Fifteenth Sunday after Pentecost", "2026-09-07.pdf");
pdfFor("EP Newsletter", "Sample Issue: Exaltation of the Cross", "2026-09-14.pdf");
pdfFor("EP Newsletter", "Sample Issue: St. Michael", "2026-09-28.pdf");

console.log("Sample PDFs written to issues/");
