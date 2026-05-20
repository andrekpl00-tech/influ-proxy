const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// ❌ bloqueia homepage
app.get("/", (req, res) => {
  res.status(404).send("404 Page Not Found");
});

// ✅ passa tudo para o Kutt
app.use(
  "/",
  createProxyMiddleware({
    target: "https://SEU-KUTT.up.railway.app",
    changeOrigin: true
  })
);

app.listen(process.env.PORT || 3000);
