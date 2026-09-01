/**
 * 将 WASM 运行库从 node_modules 复制到 public/vendor/
 * 运行: npm run setup:vendor
 *
 * Ghostscript (压缩) 和 Tesseract (OCR) 依赖这些浏览器端运行库，
 * 因体积约 42MB 未纳入 git，部署前需执行本脚本。
 */
const fs = require("fs");
const path = require("path");

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
