const express = require("express");
const cookieParser = require("cookie-parser");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cookieParser());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "your-secret-key";
const KUTT_URL = process.env.KUTT_URL || "http://Kutt-K1qn.railway.internal:3000";

// 🔒 Middleware: protect /admin routes with Bearer token auth
function adminAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const queryToken = req.query.token || null;
  const cookieToken = req.cookies ? req.cookies["admin_token"] : null;

  const token = headerToken || queryToken || cookieToken;

  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// ❌ Block homepage
app.get("/", (req, res) => {
  res.status(404).send("404 Page Not Found");
});

// 🍪 Middleware: after auth passes, inject the token into the proxied request
// so Kutt recognises the user as logged in, and set a cookie on the browser
// so subsequent requests are also authenticated without re-supplying the token.
function injectKuttAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = headerToken || req.query.token || (req.cookies && req.cookies["admin_token"]);

  if (token) {
    // Forward the token to Kutt as a cookie on the proxied request so Kutt's
    // server-side session middleware picks it up.
    const existing = req.headers["cookie"] || "";
    const kuttCookie = `token=${token}`;
    req.headers["cookie"] = existing ? `${existing}; ${kuttCookie}` : kuttCookie;

    // Also set the cookie on the browser response so future requests carry it
    // automatically (avoids needing ?token= on every navigation).
    res.cookie("admin_token", token, { httpOnly: true, sameSite: "lax" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
  }

  next();
}

// 🔒 Protected: /admin routes require authentication
app.use(
  "/admin",
  adminAuth,
  injectKuttAuth,
  createProxyMiddleware({
    target: KUTT_URL,
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
