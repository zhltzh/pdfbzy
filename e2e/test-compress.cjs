// 测试 compress-pdf 工具（真实浏览器运行 Ghostscript WASM 压缩）
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => errors.push("PAGEERROR: " + String(err).slice(0, 300)));

  try {
    // 1. 打开压缩页
    await page.goto(`${BASE}/compress-pdf`, { waitUntil: "networkidle" });
    const title = await page.title();
    console.log("页面标题:", title);

    // 2. 上传测试 PDF
    const fixture = path.join(__dirname, "..", "e2e-fixtures", "test-plain.pdf");
    if (!fs.existsSync(fixture)) {
      console.error("✗ 缺少测试素材", fixture);
      process.exit(1);
    }
    const input = await page.locator('input[type="file"]');
    await input.setInputFiles(fixture);
    console.log("已上传文件, 等待处理界面出现...");
    await page.waitForSelector("text=压缩强度", { timeout: 10000 });

    // 默认推荐压缩
    // 3. 点击压缩按钮
    console.log("点击压缩按钮...");
    await page.click('button:has-text("压缩 PDF")');

    // 4. 等待结果（压缩可能耗时长，给 120s，含引擎加载）
    console.log("等待压缩完成（首次需加载 15MB wasm 引擎）...");
    try {
      await page.waitForSelector("text=处理完成", { timeout: 120000 });
      console.log("✅ 压缩完成！");
    } catch {
      // 检查是否有错误提示
      const errText = await page
        .locator("text=压缩失败")
        .first()
        .textContent()
        .catch(() => null);
      console.log("❌ 超时或失败。页面错误文本:", errText);
      console.log("控制台错误:", errors.slice(0, 5));
      process.exit(1);
    }

    // 5. 输出下载文件名
    const fileNames = await page.locator("text=compressed").allTextContents();
    console.log("结果文件:", fileNames);

    if (errors.length > 0) {
      console.log("控制台错误(参考):", errors.slice(0, 3));
    }
    console.log("✅ compress-pdf 测试通过");
  } catch (err) {
    console.error("❌ 测试异常:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();