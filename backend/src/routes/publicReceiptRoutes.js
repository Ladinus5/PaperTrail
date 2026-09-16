const express = require("express");

const {
    getPublicReceipt,
    renderPublicReceipt,
    generatePublicReceiptPdf,
} = require("../controllers/publicReceiptController");

const router = express.Router();

router.get("/:token", getPublicReceipt);
router.get("/:token/view", renderPublicReceipt);
router.get("/:token/pdf", generatePublicReceiptPdf);

module.exports = router;