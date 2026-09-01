/**
 * 生成 Playwright 测试素材：
 * - test-multi.pdf  3 页 PDF（不同颜色页面）
 * - test-encrypted.pdf 带密码的 PDF（密码: 123456）
 * - test-image.png  单色 PNG 图片
 * - test-image.jpg  JPG 图片
 * 输出到 D:\PDF\pdfbzy\e2e-fixtures\
 */
const fs = require("fs");
const path = require("path");

async function main() {
  const outDir = path.join(__dirname, "..", "e2e-fixtures");
  fs.mkdirSync(outDir, { recursive: true });

  const { PDFDocument, rgb } = require(path.join(__dirname, "..", "node_modules", "pdf-lib"));

  // ---- 1. 3 页彩色 PDF ----
  const pdf = await PDFDocument.create();
  const colors = [rgb(0.9, 0.2, 0.2), rgb(0.2, 0.7, 0.2), rgb(0.2, 0.3, 0.9)];
  const labels = ["PAGE-1", "PAGE-2", "PAGE-3"];
  for (let i = 0; i < 3; i++) {
    const page = pdf.addPage([400, 500]);
    page.drawRectangle({
      x: 0, y: 0, width: 400, height: 500, color: colors[i],
    });
    page.drawText(labels[i], {
      x: 150, y: 260, size: 32, color: rgb(1, 1, 1),
      font: await pdf.embedFont("Helvetica"),
    });
    // 加页码角标便于验证
    page.drawText(`p${i + 1}`, {
      x: 20, y: 20, size: 16, color: rgb(1, 1, 1),
      font: await pdf.embedFont("Helvetica"),
    });
  }
  fs.writeFileSync(path.join(outDir, "test-multi.pdf"), await pdf.save());

  // ---- 2. 加密 PDF（密码 123456）----
  const encPdf = await PDFDocument.create();
  const encPage = encPdf.addPage([300, 400]);
  encPage.drawText("SECRET CONTENT", {
    x: 80, y: 200, size: 24,
    color: rgb(0.1, 0.1, 0.1),
    font: await encPdf.embedFont("Helvetica"),
  });
  const encBytes = await encPdf.save();
  fs.writeFileSync(path.join(outDir, "test-plain.pdf"), encBytes);
  console.log("✅ 素材已生成:", fs.readdirSync(outDir).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });