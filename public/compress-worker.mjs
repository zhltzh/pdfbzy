/**
 * PDF 压缩 Web Worker
 * 基于 Ghostscript WASM（@okathira/ghostpdl-wasm）在浏览器本地压缩 PDF。
 * 加载为 ES Module Worker，动态导入 gs.js（Emscripten 模块）。
 *
 * 压缩强度 preset：
 * - screen   72dpi   适用于网页/邮件（压缩量最大，70-85%）
 * - ebook    150dpi  适用于平板/阅读（45-55%）
 * - printer  300dpi  适用于桌面打印（25-35%）
 * - prepress 300dpi+ 适用于印刷（10-20%）
 */

let gsModulePromise = null;

/**
 * 懒加载并实例化 Ghostscript 模块（缓存单例）。
 * locateFile 让 Emscripten 找到 /vendor/ghostscript/gs.wasm。
 */
async function getGhostscript() {
  if (!gsModulePromise) {
    gsModulePromise = (async () => {
      const mod = await import("/vendor/ghostscript/gs.js");
      const Module = mod.default;
      const instance = await Module({
        locateFile: (file) => `/vendor/ghostscript/${file}`,
      });
      return instance;
    })();
  }
  return gsModulePromise;
}

self.onmessage = async (e) => {
  const { id, input, preset } = e.data;
  try {
    const Module = await getGhostscript();

    // 写入虚拟文件系统
    Module.FS.writeFile("input.pdf", new Uint8Array(input));

    const args = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=/${preset}`,
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dSAFER",
      `-sOutputFile=output.pdf`,
      "input.pdf",
    ];

    Module.callMain(args);

    const output = Module.FS.readFile("output.pdf", { encoding: "binary" });
    Module.FS.unlink("input.pdf");
    Module.FS.unlink("output.pdf");

    self.postMessage(
      { id, success: true, output: output.buffer },
      [output.buffer]
    );
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: String(err?.message || err),
    });
  }
};