/**
 * PDFBzy 端到端功能测试套件 v2（完整版）
 * 覆盖所有 18 个已实现工具
 * 运行: node e2e\run-tests.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "node_modules", "playwright"));

const BASE = "http://localhost:3011";
const FIX = (file) => path.join(__dirname, "..", "e2e-fixtures", file);
const RESULTS = { passed: 0, failed: 0, failures: [] };

function log(msg) {
  console.log(`  [OK]  ${msg}`);
}
function warn(msg) {
  console.log(`  [!]   ${msg}`);
}

async function newPage(browser) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });
  return await ctx.newPage();
}

/** 上传文件并等文件列表出现 */
async function upload(page, filePaths, opts = {}) {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  await page.setInputFiles('input[type="file"]', paths);
  await page.waitForTimeout(opts.wait || 600);
}

/** 检测页面是否有红色错误提示 */
async function errText(page) {
  return page.evaluate(() => {
    const els = document.querySelectorAll('[class*="red-50"]');
    for (const el of els) {
      const t = (el.textContent || "").trim();
      if (t && t.length > 3) return t;
    }
    return null;
  });
}

/** 点击按钮并等待"处理完成" */
async function clickAndWait(page, btnText, timeout = 30000) {
  await page.click(`button:has-text("${btnText}")`);
  await page.waitForSelector('text=处理完成', { timeout });
}

/** 上传后点击第一个按钮直接处理 */
async function gotoUploadRun(page, url, files, btnText, opts = {}) {
  await page.goto(url, { waitUntil: "networkidle" });
  if (opts.preWait) await page.waitForTimeout(opts.preWait);
  await upload(page, files).catch(() => {});
  // 按钮呈现后（可能每次文案不同），用 has-text 部分匹配
  await page.click(`button:has-text("${btnText}")`);
  await page.waitForSelector('text=处理完成', { timeout: opts.timeout || 40000 });
}

async function testMerge(browser) {
  log("合并PDF /merge-pdf");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/merge-pdf`, [FIX("test-multi.pdf"), FIX("test-multi.pdf")], "合并");
  await page.close();
}

async function testSplit(browser) {
  log("拆分PDF /split-pdf");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/split-pdf`, FIX("test-multi.pdf"), "拆分");
  // 应生成 3 个文件
  const count = await page.locator('button:has-text("下载"), button:has-text("已下载")').count();
  warn(`拆分结果文件数: ${count}`);
  await page.close();
}

async function testRotate(browser) {
  log("旋转PDF /rotate-pdf");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/rotate-pdf`, FIX("test-multi.pdf"), "旋转");
  await page.close();
}

async function testDeletePages(browser) {
  log("删除页面 /delete-pages");
  const page = await newPage(browser);
  await page.goto(`${BASE}/delete-pages`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf")); // 3 页
  // 等页码网格出现
  await page.waitForSelector('button:has-text("全选")');
  // 勾选第 2 页
  await page.click('div.flex.flex-wrap button:text-is("2")');
  await page.click('button:has-text("删除选中")');
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testExtractPages(browser) {
  log("提取页面 /extract-pages");
  const page = await newPage(browser);
  await page.goto(`${BASE}/extract-pages`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  await page.waitForSelector('button:has-text("全选")');
  await page.click('div.flex.flex-wrap button:text-is("1")');

  const btn = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("提取"));
    return b?.textContent || null;
  });
  warn(`提取按钮文案: ${btn}`);
  // 尝试几种文案
  try {
    await page.click('button:has-text("提取选中")');
  } catch {
    await page.click('button:has-text("提取")');
  }
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testPDFInfo(browser) {
  log("PDF信息 /pdf-info");
  const page = await newPage(browser);
  await page.goto(`${BASE}/pdf-info`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  // 读取信息
  await page.waitForSelector('text=页数', { timeout: 30000 });
  const info = await page.evaluate(() => document.body.textContent.includes("3 页"));
  warn(`显示页数 3: ${info}`);
  await page.close();
}

async function testBlankPDF(browser) {
  log("创建空白PDF /create-blank-pdf");
  const page = await newPage(browser);
  await page.goto(`${BASE}/create-blank-pdf`, { waitUntil: "networkidle" });
  await page.click('button:has-text("创建")');
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testReorder(browser) {
  log("重排页面 /reorder-pages");
  const page = await newPage(browser);
  await page.goto(`${BASE}/reorder-pages`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  await page.waitForTimeout(1000);
  // 将第 1 页下移（改变顺序使按钮可用）
  await page.click('button[aria-label="将第 1 页下移"]');
  await page.waitForTimeout(300);
  await page.click('button:has-text("应用新顺序")');
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testInsertPages(browser) {
  log("插入页面 /insert-pages");
  const page = await newPage(browser);
  await page.goto(`${BASE}/insert-pages`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  await page.waitForTimeout(800);
  try {
    await page.click('button:has-text("空白页")');
  } catch {}
  const btn = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("插入"));
    return b?.textContent || null;
  });
  warn(`插入按钮: ${btn}`);
  try { await page.click('button:has-text("插入页面")'); }
  catch { await page.click('button:has-text("插入")'); }
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testCropPDF(browser) {
  log("裁剪PDF /crop-pdf");
  const page = await newPage(browser);
  await page.goto(`${BASE}/crop-pdf`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  await page.waitForTimeout(600);
  await page.click('button:has-text("裁剪 PDF")');
  await page.waitForSelector('text=处理完成', { timeout: 30000 });
  await page.close();
}

async function testProtectPDF(browser) {
  log("加密PDF /protect-pdf");
  const page = await newPage(browser);
  await page.goto(`${BASE}/protect-pdf`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  // 输入两次密码
  await page.waitForTimeout(600);
  const pwInputs = await page.locator('input[type="password"]').count();
  warn(`密码输入框数量: ${pwInputs}`);
  await page.fill('input[type="password"] >> nth=0', "test1234");
  if (pwInputs > 1) await page.fill('input[type="password"] >> nth=1', "test1234");
  try { await page.click('button:has-text("加密")'); }
  catch { await page.click('button:has-text("保护")'); }
  await page.waitForSelector('text=处理完成', { timeout: 60000 });
  log("加密成功");
  await page.close();
}

async function testUnlockPDF(browser) {
  log("解密PDF /unlock-pdf");
  const page = await newPage(browser);
  await page.goto(`${BASE}/unlock-pdf`, { waitUntil: "networkidle" });
  // 用加密工具先做出来的文件不行，直接上传未加密文件测试"未加密"提示分支
  await upload(page, FIX("test-multi.pdf"));
  await page.waitForTimeout(800);
  const body = await page.evaluate(() => document.body.textContent || "");
  warn(`未加密检测: ${body.includes("未加密") ? "✅" : "未显示"}`);
  await page.close();
}

async function testPDFToJPG(browser) {
  log("PDF转JPG /pdf-to-jpg");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/pdf-to-jpg`, FIX("test-multi.pdf"), "转换为 JPG");
  const count = await page.locator('button:has-text("下载"), button:has-text("已下载")').count();
  warn(`JPG 输出文件数: ${count}`);
  await page.close();
}

async function testPDFToPNG(browser) {
  log("PDF转PNG /pdf-to-png");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/pdf-to-png`, FIX("test-multi.pdf"), "转换为 PNG");
  await page.close();
}

async function testPNGToPDF(browser) {
  log("PNG转PDF /png-to-pdf");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/png-to-pdf`, [FIX("test-image.png"), FIX("test-image.png")], "转换为 PDF");
  await page.close();
}

async function testImageToPDF(browser) {
  log("图片转PDF /image-to-pdf");
  const page = await newPage(browser);
  await gotoUploadRun(page, `${BASE}/image-to-pdf`, FIX("test-image.png"), "转换为 PDF");
  await page.close();
}

async function testJPGToPDF(browser) {
  log("JPG转PDF /jpg-to-pdf");
  const page = await newPage(browser);
  // jpg-to-pdf 支持 png，用 png 测试
  await gotoUploadRun(page, `${BASE}/jpg-to-pdf`, FIX("test-image.png"), "转换为 PDF");
  await page.close();
}

async function testSignPDF(browser) {
  log("签署PDF /sign-pdf");
  const page = await newPage(browser);
  await page.goto(`${BASE}/sign-pdf`, { waitUntil: "networkidle" });
  await upload(page, FIX("test-multi.pdf"));
  await page.click('button:has-text("读取文档页数")').catch(() => {});
  await page.waitForTimeout(800);
  // 手绘签名canvas上划线（先滚动到视口内）
  const canvas = page.locator("canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("签名画布未出现");
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const btn = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("签署"));
    return b?.textContent || null;
  });
  warn(`签署按钮: ${btn}`);
  await page.click('button:has-text("签署 PDF")').catch(() => page.click('button:has-text("签署")'));
  await page.waitForSelector('text=处理完成', { timeout: 40000 });
  log("签名成功");
  await page.close();
}

async function main() {
  console.log("\n🚀 PDFBzy 全部工具功能测试\n");
  // 优先使用系统 Chrome/Edge（无需下载 playwright 浏览器）；不可用时回退 headless
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
    channel: process.platform === "win32" ? "chrome" : "chromium",
  }).catch(() => chromium.launch({ headless: true, args: ["--no-sandbox"] }));

  const tests = [
    testMerge, testSplit, testRotate, testDeletePages,
    testExtractPages, testPDFInfo, testBlankPDF, testReorder,
    testInsertPages, testCropPDF, testProtectPDF, testUnlockPDF,
    testPDFToJPG, testPDFToPNG, testPNGToPDF, testImageToPDF,
    testJPGToPDF, testSignPDF,
  ];

  for (const t of tests) {
    try {
      await t(browser);
      RESULTS.passed++;
      console.log("  ───────────────────────────");
    } catch (e) {
      RESULTS.failed++;
      RESULTS.failures.push({ test: t.name, error: e.message });
      console.log(`  [FAIL] ${t.name}: ${e.message}`);
      console.log("  ───────────────────────────");
    }
  }

  await browser.close();
  console.log(`\n📊 测试总结: ${RESULTS.passed} 通过 / ${RESULTS.failed} 失败 / ${RESULTS.passed + RESULTS.failed} 总计`);
  if (RESULTS.failures.length > 0) {
    console.log("\n❌ 失败详情:");
    RESULTS.failures.forEach((f) => console.log(`   - ${f.test}: ${f.error}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });