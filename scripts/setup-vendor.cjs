/**
 * 将 WASM 运行库从 node_modules 复制到 public/vendor/
 * 运行: npm run setup:vendor
 *
 * Ghostscript (压缩) 和 Tesseract (OCR) 依赖这些浏览器端运行库，
 * 因体积约 42MB 未纳入 git，部署前需执行本脚本。
 */
const fs = require("fs");
const path = require("path");
const dns = require("dns");

const ROOT = path.join(__dirname, "..");
const VENDOR = path.join(ROOT, "public", "vendor");

const SOURCES = [
  // ghostscript
  {
    src: path.join(ROOT, "node_modules", "@okathira", "ghostpdl-wasm", "dist", "gs.js"),
    dest: path.join(VENDOR, "ghostscript", "gs.js"),
  },
  {
    src: path.join(ROOT, "node_modules", "@okathira", "ghostpdl-wasm", "dist", "gs.wasm"),
    dest: path.join(VENDOR, "ghostscript", "gs.wasm"),
  },
  // tesseract worker
  {
    src: path.join(ROOT, "node_modules", "tesseract.js", "dist", "worker.min.js"),
    dest: path.join(VENDOR, "tesseract", "worker.min.js"),
  },
];

// tesseract core wasm 文件（支持不同 SIMD 能力，按需复制存在项）
const TESS_CORE_PREFIXES = [
  "tesseract-core",
  "tesseract-core-simd",
  "tesseract-core-lstm",
  "tesseract-core-simd-lstm",
  "tesseract-core-relaxedsimd",
  "tesseract-core-relaxedsimd-lstm",
];
const TESS_SRC_DIR = path.join(ROOT, "node_modules", "tesseract.js", "dist");

let copied = 0;
let missing = [];

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) {
    missing.push(path.relative(ROOT, src));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
  console.log(`  ✓ ${path.relative(ROOT, dest)}`);
}

console.log("复制 WASM 运行库到 public/vendor/\n");

for (const item of SOURCES) {
  copyIfExists(item.src, item.dest);
}

// tesseract core：wasm 与 .wasm.js（JS 包装）两种形态
for (const prefix of TESS_CORE_PREFIXES) {
  for (const ext of [".wasm", ".wasm.js"]) {
    copyIfExists(
      path.join(TESS_SRC_DIR, prefix + ext),
      path.join(VENDOR, "tesseract", prefix + ext)
    );
  }
}

console.log(`\n完成：复制 ${copied} 个文件`);
if (missing.length > 0) {
  console.log(`\n以下依赖文件未找到（可忽略，对应功能可能受限）:`);
  missing.forEach((m) => console.log(`  - ${m}`));
}

// ===== Tesseract 语言包（OCR 用）=====
// 语言包约 30MB，未纳入 git，构建时下载到 public/vendor/tesseract/tessdata/
// 下载失败不中断构建：前端会回退到 CDN，仅影响国内访问速度。
const TESSDATA_DIR = path.join(VENDOR, "tesseract", "tessdata");
const TESSDATA_FILES = ["eng.traineddata.gz", "chi_sim.traineddata.gz"];
// 多源兜底：projectnaptha 官方镜像优先，jsDelivr / unpkg 镜像次之
const TESSDATA_URLS = {
  "eng.traineddata.gz": [
    "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz",
    "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0/eng.traineddata.gz",
    "https://unpkg.com/@tesseract.js-data/eng@1.0.0/4.0.0/eng.traineddata.gz",
  ],
  "chi_sim.traineddata.gz": [
    "https://tessdata.projectnaptha.com/4.0.0/chi_sim.traineddata.gz",
    "https://cdn.jsdelivr.net/npm/@tesseract.js-data/chi_sim@1.0.0/4.0.0/chi_sim.traineddata.gz",
    "https://unpkg.com/@tesseract.js-data/chi_sim@1.0.0/4.0.0/chi_sim.traineddata.gz",
  ],
};
// 合理的最小体积，用于判断已有文件是否完整（eng ~10.4MB / chi_sim ~19.2MB）
const TESSDATA_MIN_SIZE = 1024 * 1024;

// 部分网络下 DNS 优先返回不可用的 IPv6 地址，导致 fetch 卡死
dns.setDefaultResultOrder("ipv4first");

function isGzip(buf) {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

/** 只读文件头两个字节判断是否为 gzip */
function isGzipFile(file) {
  const fd = fs.openSync(file, "r");
  try {
    const head = Buffer.alloc(2);
    fs.readSync(fd, head, 0, 2, 0);
    return isGzip(head);
  } finally {
    fs.closeSync(fd);
  }
}

function isUsableTessdata(file) {
  return (
    fs.existsSync(file) &&
    fs.statSync(file).size > TESSDATA_MIN_SIZE &&
    isGzipFile(file)
  );
}

async function downloadTessdata(name) {
  const dest = path.join(TESSDATA_DIR, name);
  if (isUsableTessdata(dest)) {
    const mb = (fs.statSync(dest).size / 1048576).toFixed(1);
    console.log(`[tessdata] ${name} 已存在，跳过 (${mb}MB)`);
    return true;
  }
  for (const url of TESSDATA_URLS[name]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) {
        console.warn(`[tessdata] ${name} 下载失败 ${res.status}：${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (!isGzip(buf)) {
        console.warn(`[tessdata] ${name} 返回内容不是 gzip，换下一个源：${url}`);
        continue;
      }
      fs.mkdirSync(TESSDATA_DIR, { recursive: true });
      fs.writeFileSync(dest, buf);
      console.log(`[tessdata] ${name} 已下载 (${(buf.length / 1048576).toFixed(1)}MB)`);
      return true;
    } catch (err) {
      console.warn(`[tessdata] ${name} 下载异常：${url} (${err.message})`);
    }
  }
  console.warn(`[tessdata] 警告：${name} 未能获取，线上 OCR 将回退到境外 CDN`);
  return false;
}

(async () => {
  console.log("\n检查 Tesseract 语言包");
  for (const name of TESSDATA_FILES) {
    await downloadTessdata(name);
  }
  // 构建后自检
  const absent = TESSDATA_FILES.filter(
    (f) => !isUsableTessdata(path.join(TESSDATA_DIR, f))
  );
  if (absent.length > 0) {
    console.warn(`[tessdata] 警告：缺失 ${absent.join(", ")}，线上 OCR 将回退到境外 CDN`);
  }
})();
