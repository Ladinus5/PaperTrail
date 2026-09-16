const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Cookie first (for browser/EJS)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback: Authorization header (for API/mobile)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Separate one for page routes — redirects to /login instead of 401 JSON
const protectPage = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (!user) return res.redirect("/login");

    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

// Soft auth — populates req.user if cookie exists, but doesn't block
const attachUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true },
    });

    if (user) req.user = user;
    next();
  } catch {
    res.clearCookie("token");
    next();
  }
};

module.exports = protect;
module.exports.protect = protect;
module.exports.protectPage = protectPage;
module.exports.attachUser = attachUser;