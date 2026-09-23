const express = require("express");

const {
    create,
    getAll,
    getOne,
    updateSettings,
    setDefault,
} = require("../controllers/templateController");

const { protect } = require("../middleware/authMiddleware");   // ⭐ destructure

const router = express.Router();

router.use(protect);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.patch("/:id/settings", updateSettings);
router.post("/:id/set-default", setDefault);

module.exports = router;