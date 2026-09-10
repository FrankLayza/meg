import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadAllScenarios, loadScenario, buildSimulatedScenario } from "./scenarios.js";
import type { DemoScenarioId, SimulationParams } from "./types.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(CURRENT_DIR, "..", "public");

const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // Simulation Endpoint
  if (req.method === "POST" && pathname === "/api/simulate") {
    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", () => {
      try {
        const params = (rawBody ? JSON.parse(rawBody) : {}) as SimulationParams;
        const scenario = buildSimulatedScenario(params);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(scenario));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Invalid simulation request: ${String(err)}` }));
      }
    });
    return;
  }

  // API Endpoints
  if (pathname === "/api/scenarios") {
    try {
      const scenarios = await loadAllScenarios();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(scenarios));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
      return;
    }
  }

  if (pathname.startsWith("/api/scenarios/")) {
    const scenarioId = pathname.replace("/api/scenarios/", "").toLowerCase() as DemoScenarioId;
    try {
      const scenario = await loadScenario(scenarioId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(scenario));
      return;
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Scenario ${scenarioId} not found` }));
      return;
    }
  }

  // Static File Serving
  let filePath = resolve(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname.slice(1));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(` Milestone-Escrow Guardian Web Dashboard`);
  console.log(` Running at: http://localhost:${PORT}`);
  console.log(` Press Ctrl+C to stop.`);
  console.log(`================================================================\n`);
});
