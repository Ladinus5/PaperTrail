const express = require("express");

const {
    createCustomer,
    getCustomers,
    getCustomer,
    deleteCustomer,
} = require("../controllers/customerController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;