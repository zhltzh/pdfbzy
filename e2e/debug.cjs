/**
 * 诊断脚本：分析 crop-pdf 与 sign-pdf 交互问题
 */
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "node_modules", "playwright"));

const BASE = "http://localhost:3000";
const FIX = (f) => path.join(__dirname, "..", "e2e-fixtures", f);

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });

  // ====== 诊断 crop ======
  console.log("\n=== CROP 诊断 ===");
  const p1 = await ctx.newPage();
  await p1.goto(`${BASE}/crop-pdf`, { waitUntil: "networkidle" });
  await p1.setInputFiles('input[type="file"]', FIX("test-multi.pdf"));
  await p1.waitForTimeout(1000);
  const btns = await p1.evaluate(() =>
    [...document.querySelectorAll("button")].map((b) => b.textContent.trim().replace(/\s+/g, " "))
  );
  console.log("全部按钮:", JSON.stringify(btns.filter((t) => t.includes("裁剪"))));

  console.log("\n=== SIGN 诊断 ===");
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/sign-pdf`, { waitUntil: "networkidle" });
  await p2.setInputFiles('input[type="file"]', FIX("test-multi.pdf"));
  await p2.waitForTimeout(800);
  // 检查读取按钮
  const readBtn = await p2.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /读取文档页数|页数/.test(b.textContent));
    return btn ? btn.textContent.trim() : null;
  });
  console.log("读取页数按钮:", readBtn);
  if (readBtn) {
    await p2.click('button:has-text("读取文档页数")');
    await p2.waitForTimeout(1000);
  }
  // 检查 canvas
  const canvases = await p2.evaluate(() => {
    const cs = [...document.querySelectorAll("canvas")];
    return cs.map((c, i) => ({
      i,
      w: c.width,
      h: c.height,
      cssW: c.style.width,
      rectW: c.getBoundingClientRect().width,
    }));
  });
  console.log("canvas 列表:", JSON.stringify(canvases));

  if (canvases.length > 0) {
    const canvas = p2.locator("canvas").first();
    const box = await canvas.boundingBox();
    console.log("画布 box:", JSON.stringify(box));
    if (box) {
      await p2.mouse.move(box.x + 30, box.y + 30);
      await p2.mouse.down();
      await p2.mouse.move(box.x + 100, box.y + 80, { steps: 5 });
      await p2.mouse.up();
      await p2.waitForTimeout(500);
    }
    const btn2 = await p2.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /签署|签名/.test(x.textContent));
      return b ? b.textContent.trim() : "无";
    });
    console.log("签署按钮:", btn2);
  }

  await ctx.close();
  await browser.close();
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });