const prisma = require("../config/database");
const express = require("express");
const router = express.Router();
const { protectPage } = require("../middleware/authMiddleware");

// ---- Public pages ----
router.get("/", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("landing", {
    title: "Papertrail — e-Receipts",
    layout: "layouts/auth",
  });
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

router.get("/signup", (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  res.render("signup", {
    title: "Create Account",
    layout: "layouts/auth",
    errors: [],
    values: {},
  });
});

// ---- Protected pages ----
router.get("/dashboard", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;   // ⭐ fixed

    const [totalSales, receiptCount, customerCount, recentReceipts] = await Promise.all([
      prisma.receipt.aggregate({
        where: { companyId },
        _sum: { total: true },
      }),
      prisma.receipt.count({
        where: { companyId },
      }),
      prisma.customer.count({
        where: { companyId },
      }),
      prisma.receipt.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
    ]);

    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? "Good morning" :
      hour < 17 ? "Good afternoon" :
                  "Good evening";

    res.render("dashboard", {
      title: "Dashboard",
      activePage: "dashboard",
      layout: "layouts/main",
      greeting,
      stats: {
        totalSales: totalSales._sum.total || 0,
        receiptCount,
        customerCount,
      },
      recentReceipts,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/receipts/new", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;

    const [customers, templates, lastReceipt] = await Promise.all([
      prisma.customer.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.receiptTemplate.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.receipt.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: { receiptNumber: true },
      }),
    ]);

    const prefix = req.user.company.receiptPrefix || "REC";
    let nextNumber = `${prefix}-000001`;
    if (lastReceipt?.receiptNumber) {
      const m = lastReceipt.receiptNumber.match(/(\d+)$/);
      if (m) nextNumber = `${prefix}-${String(parseInt(m[1], 10) + 1).padStart(6, "0")}`;
    }

    res.render("create-receipts", {
      title: "Create Receipt",
      activePage: "receipts",
      layout: "layouts/main",
      customers,
      templates,
      nextNumber,
      preselectedCustomerId: req.query.customer || null,
      company: req.user.company,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/receipts", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;
    const customerFilter = req.query.customer || null;

    const where = { companyId };
    if (customerFilter) where.customerId = customerFilter;

    const [receipts, totalCount, totals] = await Promise.all([
      prisma.receipt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      prisma.receipt.count({ where }),
      prisma.receipt.aggregate({
        where,
        _sum: { total: true },
      }),
    ]);

    res.render("receipts", {
      title: "Receipts",
      activePage: "receipts",
      layout: "layouts/main",
      receipts,
      totalCount,
      totalValue: totals._sum.total || 0,
      customerFilter,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/customers", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          _count: { select: { receipts: true } },
          receipts: {
            select: { total: true, paymentStatus: true, createdAt: true },
          },
        },
      }),
      prisma.customer.count({ where: { companyId } }),
    ]);

    // Compute lifetime spend + last activity per customer
    const customersWithStats = customers.map(c => {
      const lifetime = c.receipts.reduce(
        (sum, r) => sum + Number(r.total),
        0
      );
      const lastReceipt = c.receipts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        initials: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        receiptCount: c._count.receipts,
        lifetimeSpend: lifetime,
        lastActivity: lastReceipt ? lastReceipt.createdAt : c.createdAt,
      };
    });

    res.render("customers", {
      title: "Customers",
      activePage: "customers",
      layout: "layouts/main",
      customers: customersWithStats,
      totalCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/templates", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;

    const [templates, company] = await Promise.all([
      prisma.receiptTemplate.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
      }),
    ]);

    res.render("templates", {
      title: "Templates",
      activePage: "templates",
      layout: "layouts/main",
      templates: templates.map(t => ({
        ...t,
        isDefault: t.id === company.defaultTemplateId,
      })),
      company,
    });
  } catch (err) {
    next(err);
  }
});

// Add to pagesRoutes.js (or a dedicated route file)
router.get("/r/template/:templateId", protectPage, async (req, res, next) => {
  try {
    const companyId = req.user.company.id;
    const template = await prisma.receiptTemplate.findFirst({
      where: { id: req.params.templateId, companyId },
    });
    if (!template) return res.status(404).send("Template not found");

    const fakeReceipt = {
      receiptNumber: "PREVIEW-0001",
      subtotal: 1000,
      discount: 0,
      tax: 0,
      total: 1000,
      paymentMethod: "Bank Transfer",
      paymentStatus: "PAID",
      notes: null,
      createdAt: new Date(),
      publicToken: "preview",
    };
    const fakeCustomer = { name: "Sample Customer", email: "sample@example.com", phone: "08012345678" };
    const fakeItems = [
      { name: "Sample Item", quantity: 1, unitPrice: 1000, total: 1000 },
      { name: "Second Item", quantity: 2, unitPrice: 500, total: 1000 },
    ];

    const type = template.type || "modern";
    res.render(`receipts/${type}`, {
      receipt: fakeReceipt,
      company: req.user.company,
      customer: fakeCustomer,
      items: fakeItems,
      template: { name: template.name, type: template.type, settings: template.settings || {} },
      settings: template.settings || {},
      layout: false,          // ⭐ receipt view has its own <html>
    });
  } catch (err) {
    next(err);
  }
});

router.get("/settings", protectPage, (req, res) => {
  res.render("settings", {
    title: "Settings",
    activePage: "settings",
    layout: "layouts/main",
  });
});

module.exports = router;