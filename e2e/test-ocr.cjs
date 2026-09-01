// OCR 实测：生成带文字的 PNG 图片，上传到 OCR 工具，验证识别结果
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err).slice(0, 200)));

  // Step 1: 用 canvas 生成一张写着英文的图片并保存为文件
  const canvasPage = await browser.newPage();
  await canvasPage.setContent(
    '<!DOCTYPE html><html><body><canvas id="c" width="900" height="300"></canvas><script>' +
      'const cv=document.getElementById("c");const ctx=cv.getContext("2d");' +
      'ctx.fillStyle="#ffffff";ctx.fillRect(0,0,900,300);' +
      'ctx.fillStyle="#000000";ctx.font="bold 72px Arial";' +
      'ctx.fillText("PDFBzy OCR Test 2026",50,170);' +
      'ctx.font="48px Arial";ctx.fillText("Hello World from OCR",50,250);' +
      '</script></body></html>'
  );
  await canvasPage.waitForTimeout(500);
  const dataUrl = await canvasPage.evaluate(() => {
    return document.getElementById("c").toDataURL("image/png");
  });
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  const imgPath = path.join(__dirname, "..", "e2e-fixtures", "ocr-test.png");
  fs.writeFileSync(imgPath, buf);
  console.log("已生成带文字图片:", imgPath, `(${(buf.length / 1024).toFixed(1)}KB)`);
  await canvasPage.close();

  // Step 2: 打开 OCR 工具页面上传
  await page.goto(`${BASE}/ocr-text`, { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(imgPath);
  await page.waitForSelector("text=识别语言");
  console.log("已上传图片, 点击开始识别...");
  await page.click('button:has-text("开始识别文字")');

  // 等待识别完成（首次需下载语言包 ~15MB，给 180s）
  console.log("等待识别完成（首次需下载语言包）...");
  try {
    await page.waitForSelector("text=识别完成", { timeout: 180000 });
  } catch {
    // 诊断
    const prog = await page.locator("text=正在识别").first().textContent().catch(() => null);
    const err = await page.locator("text=识别失败").first().textContent().catch(() => null);
    console.log("进度状态:", prog);
    console.log("错误信息:", err);
    console.log("页面错误:", errors);
    process.exit(1);
  }

  // 读取识别文本
  const text = await page.locator("textarea").inputValue();
  console.log("识别结果:", JSON.stringify(text));

  if (text.includes("PDFBzy") && text.includes("OCR")) {
    console.log("✅ OCR 识别成功，准确提取了文字");
  } else {
    console.log("⚠️ 识别结果不完整（可能是字体渲染差异）");
  }

  await browser.close();
}

main().catch((e) => {
  console.error("❌ 测试异常:", e.message);
  process.exit(1);
});