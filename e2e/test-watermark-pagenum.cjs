// 正式 E2E：watermark-pdf 和 page-number 工具
// 流程：真实浏览器上传→处理→下载→pdf-lib + zlib 解压验证图片绘制指令
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { PDFDocument } = require("pdf-lib");

const BASE = process.env.BASE_URL || "http://localhost:3000";

// 解压 PDF 并统计含图片绘制指令 (/Name Do) 的流数量
async function countImageDrawStreams(filePath, expectedPages) {
  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes);
  const context = doc.context;
  const streams = [...context.indirectObjects.entries()].filter(
    ([, o]) => o.constructor.name === "PDFRawStream"
  );
  let imageDrawStreams = 0;
  for (const [, obj] of streams) {
    const raw = Buffer.from(obj.getContents());
    let text;
    try {
      text = zlib.inflateSync(raw).toString("latin1");
    } catch {
      text = raw.toString("latin1");
    }
    if (/\/[A-Za-z0-9-]+\s+Do\b/.test(text)) imageDrawStreams++;
  }
  return { totalPages: doc.getPageCount(), imageDrawStreams };
}

async function runToolTest(browser, slug, buttonText, fixturePath, outName, tuple) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err).slice(0, 200)));
  let pass = false;

  try {
    await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await page.waitForSelector(`button:has-text("${buttonText}")`, { timeout: 10000 });

    // tuple: [selector, clickText, value] 用于配置（可选）
    if (tuple) {
      if (tuple[0] === "click") {
        await page.click(`button:has-text("${tuple[1]}")`);
      } else if (tuple[0] === "fill") {
        await page.fill(tuple[1], tuple[2]);
      }
    }

    await page.click(`button:has-text("${buttonText}")`);
    await page.waitForSelector("text=处理完成", { timeout: 60000 });

    const dp = page.waitForEvent("download", { timeout: 15000 });
    await page.locator('button:has-text("下载文件")').first().click();
    const download = await dp;
    const out = path.join(__dirname, "..", "e2e-fixtures", outName);
    await download.saveAs(out);

    const { totalPages, imageDrawStreams } = await countImageDrawStreams(out, 1);
    // 期望：每页应有 1 个图片绘制流（页码/水印）
    const expected = totalPages; // 每页一个图片绘制流
    pass = imageDrawStreams >= expected;
    console.log(
      `  ${slug}: ${totalPages} 页, 图片绘制流 ${imageDrawStreams} 个 (期望 >=${expected}) ${
        pass ? "✅" : "❌"
      }`
    );
    if (errors.length) console.log("  控制台错误:", errors.slice(0, 3));
  } catch (e) {
    console.log(`  ${slug}: 异常 ${e.message.slice(0, 120)}`);
    console.log("  控制台错误:", errors.slice(0, 3));
  }
  await page.close();
  return pass;
}

async function main() {
  const browser = await chromium.launch();

  const plainPdf = path.join(__dirname, "..", "e2e-fixtures", "test-plain.pdf");
  const multiPdf = path.join(__dirname, "..", "e2e-fixtures", "test-multi.pdf");
  if (!fs.existsSync(plainPdf) || !fs.existsSync(multiPdf)) {
    console.error("缺少测试素材");
    process.exit(1);
  }

  console.log("=== watermark-pdf ===");
  const wm = await runToolTest(
    browser, "watermark-pdf", "添加水印", plainPdf,
    "out-watermarked-final.pdf", null
  );

  console.log("=== page-number (多页, 第X页/共Y页) ===");
  // 配置：选择"第 X 页 / 共 Y 页"，起始页码 5
  const pnTuples = [
    ["click", "第 X 页 / 共 Y 页"],
    ["fill", 'input[type="number"]', "5"],
  ];
  // 页面结构不同，单独处理
  const page = await browser.newPage();
  let pn = false;
  try {
    await page.goto(`${BASE}/page-number`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles(multiPdf);
    await page.waitForSelector('button:has-text("添加页码")', { timeout: 10000 });
    await page.click('button:has-text("第 X 页 / 共 Y 页")');
    await page.fill('input[type="number"]', "5");
    await page.click('button:has-text("添加页码")');
    await page.waitForSelector("text=处理完成", { timeout: 60000 });
    const dp = page.waitForEvent("download", { timeout: 15000 });
    await page.locator('button:has-text("下载文件")').first().click();
    const download = await dp;
    const out = path.join(__dirname, "..", "e2e-fixtures", "out-numbered-final.pdf");
    await download.saveAs(out);
    const { totalPages, imageDrawStreams } = await countImageDrawStreams(out, 3);
    pn = imageDrawStreams >= totalPages;
    console.log(
      `  page-number: ${totalPages} 页, 图片绘制流 ${imageDrawStreams} 个 (期望 >=${totalPages}) ${pn ? "✅" : "❌"}`
    );
  } catch (e) {
    console.log(`  page-number: 异常 ${e.message.slice(0, 120)}`);
  }
  await page.close();

  await browser.close();
  const ok = wm && pn;
  console.log(`\n===== 结果: ${ok ? "全部通过 ✅" : "有失败 ❌"} =====`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("崩溃:", e);
  process.exit(1);
});