const express = require("express");
const router = express.Router();
const { protectPage } = require("../middleware/authMiddleware");

// ---- Public pages ----
router.get("/", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("landing", { title: "Papertrail — e-Receipts" });
});

router.get("/login", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("login", {
    title: "Sign In",
    layout: "layouts/auth",
    errors: [],
    values: {},
  });
});

router.get("/register", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("register", {
    title: "Create Account",
    layout: "layouts/auth",
    errors: [],
    values: {},
  });
});

// ---- Protected pages ----
router.get("/dashboard", protectPage, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    activePage: "dashboard",
  });
});

module.exports = router;