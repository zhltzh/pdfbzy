// 生成一个大体积测试 PDF（内嵌大尺寸彩色图片 + 多页），用于压缩效果数值验证
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const zlib = require("zlib");

// 生成一张大尺寸 JPEG（随机彩色噪点，压缩率低，适合测压缩）
function makeBigPNG(w, h) {
  const { PNG } = (() => {
    // 直接手写简单 PNG (真彩 8bit RGB)
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type RGB
    // 其余 0

    // IDAT: 每行一个 filter byte (0) + RGB 数据
    const raw = Buffer.alloc(h * (1 + w * 3));
    for (let y = 0; y < h; y++) {
      const rowStart = y * (1 + w * 3);
      raw[rowStart] = 0;
      for (let x = 0; x < w; x++) {
        const idx = rowStart + 1 + x * 3;
        raw[idx] = Math.floor(Math.random() * 256); // R
        raw[idx + 1] = Math.floor(Math.random() * 256); // G
        raw[idx + 2] = Math.floor(Math.random() * 256); // B
      }
    }
    const compressed = zlib.deflateSync(raw);

    // chunk helper
    function chunk(type, data) {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);
      const typeBuf = Buffer.from(type);
      const crcInput = Buffer.concat([typeBuf, data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
      return Buffer.concat([len, typeBuf, data, crc]);
    }
    function crc32(buf) {
      let c = ~0;
      for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
        }
      }
      return ~c;
    }
    return { PNG: null };
  })();

  // 上面闭包没导出，干脆直接用 Buffer 返回 PNG 字节
  return buildPNG(w, h);
}

function buildPNG(w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcInput = Buffer.concat([typeBuf, data]);
    let c = ~0;
    for (let i = 0; i < crcInput.length; i++) {
      c ^= crcInput[i];
      for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(~c >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    raw[rowStart] = 0;
    // 使用渐变而非纯随机（更接近真实文档，JPEG 压缩效果好）
    for (let x = 0; x < w; x++) {
      const idx = rowStart + 1 + x * 3;
      raw[idx] = (x * 255) / w;
      raw[idx + 1] = (y * 255) / h;
      raw[idx + 2] = 128;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  const outDir = path.join(__dirname, "..", "e2e-fixtures");
  fs.mkdirSync(outDir, { recursive: true });

  // 生成 2 张大图（1200x800），模拟扫描图片
  const png1 = buildPNG(1200, 800);
  const png2 = buildPNG(1600, 900);
  fs.writeFileSync(path.join(outDir, "big1.png"), png1);
  fs.writeFileSync(path.join(outDir, "big2.png"), png2);

  const pdf = await PDFDocument.create();
  for (const png of [png1, png2]) {
    const img = await pdf.embedPng(png);
    const page = pdf.addPage([600, 420]);
    page.drawImage(img, { x: 0, y: 0, width: 600, height: 420 });
  }
  const bytes = await pdf.save();
  const out = path.join(outDir, "big-image.pdf");
  fs.writeFileSync(out, bytes);
  console.log(
    `生成测试 PDF: ${out} (${(bytes.length / 1024).toFixed(1)} KB, 2 页带图)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});