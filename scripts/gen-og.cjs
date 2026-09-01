// 生成 1200x630 OG 图片 PNG（蓝紫渐变 + 白色 PDF 图标 + 对勾）
const zlib = require("zlib");
const fs = require("fs");

const W = 1200, H = 630;
// 每个像素 3 字节 RGB + 每行开头 1 字节 filter(0)
const raw = Buffer.alloc(H * (1 + W * 3));

// 顶部渐变: #2563eb → #7c3aed
function hexToRgb(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
const c1 = hexToRgb("#3b82f6"); // top
const c2 = hexToRgb("#7c3aed"); // bottom

for (let y = 0; y < H; y++) {
  const lineStart = y * (1 + W * 3);
  raw[lineStart] = 0; // filter type None
  for (let x = 0; x < W; x++) {
    const t = y / (H - 1);
    let r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    let g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    let b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    const idx = lineStart + 1 + x * 3;
    raw[idx] = r; raw[idx+1] = g; raw[idx+2] = b;
  }
}

// 画一个白色 PDF 图标（圆角矩形内部用 "PDF" 色块模拟）
// 简化为中央白色圆角矩形 + 内部渐变方块
function fillRect(cx, cy, cw, ch, color) {
  for (let y = cy; y < cy + ch; y++) {
    for (let x = cx; x < cx + cw; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const idx = y * (1 + W * 3) + 1 + x * 3;
      raw[idx] = color[0]; raw[idx+1] = color[1]; raw[idx+2] = color[2];
    }
  }
}

// 半透明装饰圆
function fillCircle(cx, cy, r, color, alpha) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const d = Math.sqrt((x - cx)**2 + (y - cy)**2);
      if (d <= r) {
        const idx = y * (1 + W * 3) + 1 + x * 3;
        for (let k = 0; k < 3; k++) {
          raw[idx+k] = Math.round(raw[idx+k] * (1 - alpha) + color[k] * alpha);
        }
      }
    }
  }
}

// 装饰圆
fillCircle(1000, 140, 240, [255,255,255], 0.05);
fillCircle(160, 520, 260, [255,255,255], 0.05);
fillCircle(1120, 500, 90, [255,255,255], 0.08);

// 中央图标：圆角矩形（白色，模拟文档）+ 蓝色对勾色块
const iconW = 260, iconH = 340, iconX = (W - iconW) / 2, iconY = 130;
// 外框白色圆角（简化直角）
fillRect(iconX, iconY, iconW, iconH, [255,255,255]);
// 内部深色区块模拟文字
fillRect(iconX + 45, iconY + 60, iconW - 90, 45, [191,219,254]);
fillRect(iconX + 45, iconY + 130, iconW - 90, 45, [191,219,254]);
fillRect(iconX + 45, iconY + 200, iconW - 90, 45, [191,219,254]);
// 右侧对勾
fillCircle(iconX + iconW - 55, iconY + iconH - 55, 45, [34,197,94], 1.0);

// PNG chunks
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // color type RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);

fs.writeFileSync("public/og-image.png", png);
console.log("og-image.png generated:", png.length, "bytes");