/**
 * 生成测试 PNG 图片（纯 Node 手写 PNG 编码，无依赖）
 * 输出: e2e-fixtures/test-image.png
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height) {
  // RGBA 数据：左上红、右上绿、左下蓝、右下橙
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 4;
      if (x < width / 2 && y < height / 2) { raw[i] = 230; raw[i + 1] = 60; raw[i + 2] = 60; raw[i + 3] = 255; }
      else if (x >= width / 2 && y < height / 2) { raw[i] = 60; raw[i + 1] = 200; raw[i + 2] = 80; raw[i + 3] = 255; }
      else if (x < width / 2) { raw[i] = 60; raw[i + 1] = 100; raw[i + 2] = 230; raw[i + 3] = 255; }
      else { raw[i] = 240; raw[i + 1] = 150; raw[i + 2] = 40; raw[i + 3] = 255; }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const png = makePng(320, 200);
fs.writeFileSync(path.join(__dirname, "..", "e2e-fixtures", "test-image.png"), png);
console.log("✅ PNG 已生成:", png.length, "bytes");