const express = require("express");

const {
    create,
    getAll,
    getOne,
} = require("../controllers/templateController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);

module.exports = router;