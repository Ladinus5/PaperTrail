const express = require("express");

const {
    create,
    getAll,
    getOne,
    assignReceiptTemplate,
    renderData,
    renderReceipt,
} = require("../controllers/receiptController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.patch("/:id/template", assignReceiptTemplate);
router.get("/:id/render-data", renderData);

module.exports = router;