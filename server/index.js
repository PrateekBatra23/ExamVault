const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { PORT }        = require("./config");
const { logger, printBanner } = require("./logger");

const authRoutes    = require("./routes/auth");
const studentRoutes = require("./routes/student");
const facultyRoutes = require("./routes/faculty");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Global request logger ──────────────────────────────────────────
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next(); // skip static
  logger.request(req.method, req.originalUrl, req.ip);
  next();
});

// ── Static files ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../client")));

// ── API Routes ─────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);

// ── Health ─────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── Frontend fallbacks ─────────────────────────────────────────────
app.get("/student", (req, res) => res.sendFile(path.join(__dirname, "../client/student.html")));
app.get("/faculty", (req, res) => res.sendFile(path.join(__dirname, "../client/faculty.html")));
app.get("*",        (req, res) => res.sendFile(path.join(__dirname, "../client/index.html")));

// ── Global error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error("SERVER", "Unhandled server error", { msg: err.message });
  res.status(500).json({ success: false, message: "Internal server error." });
});

const server = app.listen(PORT, () => printBanner(PORT));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error("SERVER", `Port ${PORT} is already in use. Use a free port or kill the process using port ${PORT}.`);
    console.error(`Error: Port ${PORT} is already in use. Try set PORT=<different> in .env or run 'npx kill-port ${PORT}'.`);
    process.exit(1);
  }
  logger.error("SERVER", "Unexpected server error", { msg: err.message });
  throw err;
});

module.exports = app;
