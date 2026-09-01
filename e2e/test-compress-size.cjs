// 压缩效果数值验证：压缩 251KB 带图 PDF，捕获下载文件对比大小
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/compress-pdf`, { waitUntil: "networkidle" });

    const fixture = path.join(__dirname, "..", "e2e-fixtures", "big-image.pdf");
    const origSize = fs.statSync(fixture).size;

    await page.locator('input[type="file"]').setInputFiles(fixture);
    await page.waitForSelector("text=压缩强度");

    // 选择最大压缩
    await page.click('button:has-text("最大压缩")');
    await page.click('button:has-text("压缩 PDF")');

    await page.waitForSelector("text=处理完成", { timeout: 180000 });
    console.log("压缩完成，等待结果");

    // 触发下载并捕获
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.click('button:has-text("下载文件")'),
    ]);

    const savePath = path.join(__dirname, "..", "e2e-fixtures", "compressed-result.pdf");
    await download.saveAs(savePath);
    const compSize = fs.statSync(savePath).size;

    console.log(`原始大小: ${(origSize / 1024).toFixed(1)} KB`);
    console.log(`压缩后:   ${(compSize / 1024).toFixed(1)} KB`);
    console.log(
      `压缩率:    ${((1 - compSize / origSize) * 100).toFixed(1)}% 减小`
    );

    if (compSize < origSize) {
      console.log("✅ 压缩确实减小了文件体积");
    } else {
      console.log("⚠️ 压缩后没有变小（小文件/已高度压缩）");
    }
  } catch (err) {
    console.error("❌ 测试异常:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();