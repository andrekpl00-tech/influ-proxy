const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "your-secret-key";

// 🔒 Middleware: protect /admin routes with Bearer token auth
function adminAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// ❌ Block homepage
app.get("/", (req, res) => {
  res.status(404).send("404 Page Not Found");
});

// 🔒 Protected: /admin routes require authentication
app.use(
  "/admin",
  adminAuth,
  createProxyMiddleware({
    target: "http://Kutt:3000",
    changeOrigin: true
  })
);

// ✅ Public: all other routes pass through for link access
app.use(
  "/",
  createProxyMiddleware({
    target: "http://Kutt:3000",
    changeOrigin: true
  })
);

app.listen(process.env.PORT || 3000);
