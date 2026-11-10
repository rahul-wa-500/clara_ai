import { spawn } from "node:child_process";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 5000);
const api = spawn(process.execPath, ["config/gemini.js"], {
  stdio: "inherit",
});
let vite;
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  api.kill();
  vite?.kill();
  process.exitCode = exitCode;
}

api.once("error", (error) => {
  console.error("Could not start Clara's API server:", error.message);
  shutdown(1);
});

api.once("exit", (code) => {
  if (!shuttingDown) {
    console.error(
      `Clara's API server stopped${code === null ? "" : ` (exit code ${code})`}.`
    );
    shutdown(code || 1);
  }
});

process.once("SIGINT", () => shutdown());
process.once("SIGTERM", () => shutdown());

async function waitForApi() {
  const deadline = Date.now() + 15000;

  while (!shuttingDown && Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (!shuttingDown) {
    console.error(
      `Clara's API server did not become ready on port ${port}. Check the server output and GEMINI_API_KEY.`
    );
    shutdown(1);
  }
}

await waitForApi();
if (shuttingDown) process.exit(process.exitCode || 1);

vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js"],
  { stdio: "inherit" }
);

vite.once("error", (error) => {
  console.error("Could not start Vite:", error.message);
  shutdown(1);
});

vite.once("exit", (code) => shutdown(code || 0));
