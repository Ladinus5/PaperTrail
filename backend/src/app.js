require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const { attachUser, protectPage } = require("./middleware/authMiddleware");

const app = express();

app.set("view engine", "ejs");
app.set("layout", "layouts/auth");
app.set("views", path.join(__dirname, "views"));


const pagesRoutes = require("./routes/pagesRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const publicReceiptRoutes = require("./routes/publicReceiptRoutes");
const templateRoutes = require("./routes/templateRoutes");
const router = require("./routes/authRoutes");



// Middleware
app.use(attachUser);
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.activePage = "";
  res.locals.title = "Papertrail";
  res.locals.bodyClass = "";
  res.locals.errors = [];
  res.locals.values = {};
  next();
});

// Routes
app.use("/", pagesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/public/receipts", publicReceiptRoutes);
app.use("/api/templates", templateRoutes);


router.get("/", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("landing", { title: "Papertrail", layout: "layouts/auth" });
});


router.get("/login", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("login", { title: "Sign In", layout: "layouts/auth" });
});

app.get("/signup", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("signup", { title: "Create Account", layout: "layouts/auth" });
});

router.get("/dashboard", protectPage, (req, res) => {
  res.render("dashboard", { title: "Dashboard", activePage: "dashboard", layout: "layouts/main" });
});

router.get("/receipts/new", (req, res) => {
    res.render("create-receipts", {
        title: "Papertrail - Create Receipt"
    });
});

router.get("/receipts", (req, res) => {
    res.render("receipts");
});

router.get("/customers", (req, res) => {
    res.render("customers");
});

router.get("/templates", (req, res) => {
    res.render("templates");
});

router.get("/settings", (req, res) => {
    res.render("settings");
});

module.exports = app;