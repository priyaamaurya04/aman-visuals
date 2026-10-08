import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Readable, pipeline } from "stream";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
const HOST = "0.0.0.0";
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/_healthz", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/video-proxy", async (req, res) => {
  try {
    const fileId = req.query.id;
    const rawUrl = req.query.url;
    const targetUrl = fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : rawUrl;
    if (!targetUrl) {
      res.status(400).send("Missing url or id parameter");
      return;
    }
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    if (req.headers.range) {
      fetchHeaders["Range"] = req.headers.range;
    }
    let response = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow"
    });
    if (!response.ok && fileId) {
      const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      const altResponse = await fetch(altUrl, {
        headers: fetchHeaders,
        redirect: "follow"
      });
      if (altResponse.ok) {
        response = altResponse;
      }
    }
    res.status(response.status);
    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (["content-type", "content-length", "content-range", "accept-ranges", "cache-control"].includes(lower)) {
        res.setHeader(key, val);
      }
    });
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!response.body) {
      res.end();
      return;
    }
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.on("error", () => {
      if (!res.writableEnded) res.end();
    });
    res.on("close", () => {
      nodeStream.destroy();
    });
    pipeline(nodeStream, res, () => {
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send(err?.message || "Error streaming video");
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});
const distPath = path.resolve(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: "1d"
  }));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  console.warn("Warning: dist directory not found. Please run npm run build.");
  app.get("*", (_req, res) => {
    res.status(200).send("Building application assets... Please refresh shortly.");
  });
}
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
server.on("error", (err) => {
  console.error("Server listen error:", err);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
var server_default = app;
export {
  server_default as default
};
