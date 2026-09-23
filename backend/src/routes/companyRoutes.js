const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getCompany, updateCompany } = require("../controllers/companyController");

const router = express.Router();

router.use(protect);
router.get("/", getCompany);
router.patch("/", updateCompany);

module.exports = router;