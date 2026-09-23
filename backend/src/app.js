require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");

const { attachUser } = require("./middleware/authMiddleware");

const pagesRoutes = require("./routes/pagesRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const publicReceiptRoutes = require("./routes/publicReceiptRoutes");
const templateRoutes = require("./routes/templateRoutes");
const companyRoutes = require("./routes/companyRoutes")
const { formatCurrency, timeAgo } = require("./utils/format");

const app = express();

// ---- View engine ----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/auth"); // default layout

// ---- Core middleware (order matters!) ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());                                       // ⭐ BEFORE attachUser
app.use(express.static(path.join(__dirname, "../public")));

// ---- Auth: populate req.user if cookie is valid ----
app.use(attachUser);                                            // ⭐ AFTER cookieParser

// ---- Expose user + defaults to all views ----
app.use((req, res, next) => {
  res.locals.user = req.user || null;
   res.locals.company = req.user?.company || null;
  res.locals.currentPath = req.path;
  res.locals.activePage = "";
  res.locals.title = "Papertrail";
  res.locals.bodyClass = "";
  res.locals.errors = [];
  res.locals.values = {};
  res.locals.formatCurrency = formatCurrency;   // ⭐
  res.locals.timeAgo = timeAgo;  
  next();
});

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/public/receipts", publicReceiptRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/company", companyRoutes);

// Logout — clears cookie, redirects
app.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.redirect("/login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.redirect("/login");
});


// ---- Page routes (MUST come last) ----
app.use("/", pagesRoutes);

// ── 404 for unknown API routes ──
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ── Global error handler (must be last) ──
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  // API requests get JSON
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }

  // Page requests get a simple message
  res.status(err.status || 500).send('Something went wrong. Please try again.');
});

module.exports = app;