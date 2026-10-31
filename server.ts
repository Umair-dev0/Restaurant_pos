import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Connect to database or enable in-memory fallback
  try {
    const { default: connectDB } = await import("./pos-backend/config/database.js");
    await connectDB();
  } catch (err: any) {
    console.warn(`[AI Studio] Database init warning: ${err?.message}`);
  }

  const app = express();

  // Import backend express application
  const { default: backendApp } = await import("./pos-backend/app.js");
  app.use(backendApp);

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: 3000,
        hmr: false
      },
      appType: "spa",
      root: path.resolve(__dirname, "pos-frontend")
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "pos-frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Restaurant POS Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
