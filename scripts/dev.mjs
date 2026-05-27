import { spawn } from "node:child_process";
import net from "node:net";

const isWindows = process.platform === "win32";
const preferredApiPort = Number(process.env.API_PORT || 8787);

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });

const findAvailablePort = async (startPort) => {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`Nenhuma porta livre encontrada entre ${startPort} e ${startPort + 19}.`);
};

const apiPort = await findAvailablePort(preferredApiPort);
const env = {
  ...process.env,
  API_PORT: String(apiPort),
  VITE_API_PROXY_TARGET: `http://localhost:${apiPort}`,
};

if (apiPort !== preferredApiPort) {
  console.log(`[dev] Porta ${preferredApiPort} ocupada. Usando API em http://localhost:${apiPort}`);
}

const commands = [
  { name: "api", command: "node", args: ["server/index.mjs"] },
  { name: "web", command: isWindows ? "npx.cmd" : "npx", args: ["vite", "--host", "0.0.0.0"] },
];

let isShuttingDown = false;

const processes = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    if (!isShuttingDown && code !== 0) {
      process.exitCode = code ?? 1;
      shutdown();
    }
  });

  return child;
});

const shutdown = () => {
  isShuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
