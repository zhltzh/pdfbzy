// 生成"真正带文字"的 OCR 测试 PDF（pdf-lib + StandardFonts.Helvetica）
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'C:/Users/admin/AppData/Local/Temp/opencode/站素材';
mkdirSync(OUT, { recursive: true });

const docs = [
  { file: 'text-a.pdf', pages: ['HELLO WORLD PAGE ONE', 'HELLO WORLD PAGE TWO'] },
  { file: 'text-b.pdf', pages: ['BATCH TEST ALPHA', 'BATCH TEST BETA', 'BATCH TEST GAMMA'] },
  { file: 'text-c.pdf', pages: ['FINAL DOCUMENT'] },
];

const W = 612;
const H = 792;
const SIZE = 48;

for (const doc of docs) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const line of doc.pages) {
    const page = pdf.addPage([W, H]);
    const textWidth = font.widthOfTextAtSize(line, SIZE);
    page.drawText(line, {
      x: Math.max(10, (W - textWidth) / 2),
      y: H / 2,
      size: SIZE,
      font,
      color: rgb(0, 0, 0),
    });
  }
  const bytes = await pdf.save();
  const path = `${OUT}/${doc.file}`;
  writeFileSync(path, bytes);
  console.log(`${path} pages=${doc.pages.length} bytes=${bytes.length}`);
}
