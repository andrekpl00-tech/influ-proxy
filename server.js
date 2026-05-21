const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const KUTT_URL = process.env.KUTT_URL || "http://Kutt-K1qn.railway.internal:3000";
const ADMIN_UI_URL = process.env.ADMIN_UI_URL || "https://kutt-admin-ui-production.up.railway.app";

// ❌ Block homepage
app.get("/", (req, res) => {
  res.status(404).send("404 Page Not Found");
});

// 🖥️ Admin UI: /admin routes proxy to the kutt-admin-ui service
app.use(
  "/admin",
  createProxyMiddleware({
    target: ADMIN_UI_URL,
    changeOrigin: true
  })
);

// 🔗 Admin API: /api/links routes proxy to the kutt-admin-ui service
app.use(
  "/api/links",
  createProxyMiddleware({
    target: ADMIN_UI_URL,
    changeOrigin: true
  })
);

// ✅ Public: all other routes pass through for link access
app.use(
  "/",
  createProxyMiddleware({
    target: KUTT_URL,
    changeOrigin: true
  })
);

app.listen(process.env.PORT || 3000);
