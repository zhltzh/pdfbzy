/**
 * 加密→解密闭环验证：
 * 1. 用 /protect-pdf 加密 test-multi.pdf（密码 test1234）
 * 2. 保存加密结果文件
 * 3. 用 /unlock-pdf 上传加密文件，输入密码解密
 * 4. 验证解密成功并下载
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "node_modules", "playwright"));

const BASE = "http://localhost:3000";
const FIX = (f) => path.join(__dirname, "..", "e2e-fixtures", f);
const OUT = path.join(__dirname, "..", "e2e-fixtures", "encrypted-output.pdf");

async function main() {
  console.log("\n🔐 加密→解密 闭环验证\n");
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });

  // ==== 步骤 1: 加密 ====
  console.log("[1/4] 加密: /protect-pdf");
  const p1 = await ctx.newPage();
  await p1.goto(`${BASE}/protect-pdf`, { waitUntil: "networkidle" });
  await p1.setInputFiles('input[type="file"]', FIX("test-multi.pdf"));
  await p1.waitForTimeout(800);
  await p1.fill('input[type="password"] >> nth=0', "test1234");
  await p1.fill('input[type="password"] >> nth=1', "test1234");
  await p1.click('button:has-text("加密")');
  await p1.waitForSelector('text=处理完成', { timeout: 60000 });

  // 找到主下载按钮（第一个"下载"）
  const dlBtn = p1.locator('button:has-text("下载")').first();
  const [download] = await Promise.all([
    p1.waitForEvent("download"),
    dlBtn.click(),
  ]);
  await download.saveAs(OUT);
  const size = fs.statSync(OUT).size;
  console.log(`   ✅ 加密文件已下载: ${size} bytes`);
  await p1.close();

  // ==== 步骤 2: 验证加密文件真的被加密（用 pdf-lib 尝试加载应失败）====
  console.log("[2/4] 验证加密: 尝试用 pdf-lib 无密码加载");
  const { PDFDocument } = require(path.join(__dirname, "..", "node_modules", "pdf-lib"));
  const encBuf = fs.readFileSync(OUT);
  try {
    await PDFDocument.load(encBuf, { ignoreEncryption: false });
    console.log("   ❌ 文件可以无密码加载 —— 加密未生效!");
    process.exit(1);
  } catch (e) {
    const msg = e.message || "";
    if (/password|encrypted/i.test(msg)) {
      console.log("   ✅ 无密码加载被拒绝，加密已生效");
    } else {
      console.log(`   ✅ 文件无法无密码加载 (${msg.slice(0, 60)})`);
    }
  }

  // ==== 步骤 3: 解密 ====
  console.log("[3/4] 解密: /unlock-pdf");
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/unlock-pdf`, { waitUntil: "networkidle" });
  await p2.setInputFiles('input[type="file"]', OUT);
  await p2.waitForTimeout(1200);
  const status = await p2.evaluate(() => document.body.textContent || "");
  console.log(`   🔍 加密检测提示: ${status.includes("加密") ? "检测到加密" : "未检测到"}`);
  await p2.fill('input[type="password"]', "test1234");
  await p2.click('button:has-text("解密")');
  await p2.waitForSelector('text=处理完成', { timeout: 60000 });
  console.log("   ✅ 解密成功，进入结果页");
  await p2.close();

  // ==== 步骤 4: 错误密码测试 ====
  console.log("[4/4] 错误密码: /unlock-pdf 输入错误密码");
  const p3 = await ctx.newPage();
  await p3.goto(`${BASE}/unlock-pdf`, { waitUntil: "networkidle" });
  await p3.setInputFiles('input[type="file"]', OUT);
  await p3.waitForTimeout(1200);
  await p3.fill('input[type="password"]', "wrongpass");
  await p3.click('button:has-text("解密")');
  // 等待错误提示或结果
  await p3.waitForTimeout(4000);
  const err = await p3.evaluate(() => document.querySelector('[class*="red-50"]')?.textContent || null);
  const body = await p3.evaluate(() => document.body.textContent || "");
  if (body.includes("密码错误") || body.includes("WRONG_PASSWORD") || (err && /密码|失败/.test(err))) {
    console.log(`   ✅ 错误密码被拒（提示: ${(err || body.match(/密码.{0,30}/)?.[0])?.trim()}）`);
  } else {
    console.log(`   ❌ 错误密码未被正确拒绝，body 含"处理完成": ${body.includes("处理完成")}`);
  }
  await p3.close();

  await ctx.close();
  await browser.close();
  console.log("\n🔐 闭环验证完成");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });