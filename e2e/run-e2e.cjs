/**
 * 端到端测试入口：启动生产服务器 → 等待就绪 → 运行测试套件 → 关闭服务器
 * 运行: npm run test:e2e
 *
 * 注意：测试服务器默认使用 3011 端口，避免与本地其他 dev server (3000) 冲突。
 */
const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = 3011;
const BASE = `http://localhost:${PORT}`;

function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error("服务器启动超时"));
        return;
      }
      http
        .get(BASE, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => setTimeout(check, 1000));
    };
    check();
  });
}

function killProcessTree(pid) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
  } catch {
    // 进程可能已退出
  }
}

async function main() {
  console.log(`\n🚀 启动生产服务器 (port ${PORT})...`);
  const server = spawn(
    process.execPath,
    [path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)],
    { stdio: ["ignore", "pipe", "pipe"], cwd: path.join(__dirname, "..") }
  );
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  try {
    await waitForServer();
    console.log("✅ 服务器就绪，开始运行测试...\n");
    const code = await new Promise((resolve) => {
      const testProc = spawn(process.execPath, [path.join(__dirname, "run-tests.cjs")], {
        stdio: "inherit",
        shell: false,
      });
      testProc.on("close", resolve);
    });
    process.exitCode = code;
  } catch (e) {
    console.error("❌", e.message);
    process.exitCode = 1;
  } finally {
    killProcessTree(server.pid);
  }
}

main();
