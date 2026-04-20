const express = require("express");
const router = express.Router();
const packOrderController = require("../controllers/packOrderController");
const validatePackOrder = require("../middlewares/validatePackOrder");

/**
 * Route: POST /
 * Mapped to /api/v1/pack-order in app.js
 */
router.post("/", validatePackOrder, packOrderController.packOrder);

/**
 * Route: GET /
 * Mapped to /api/v1/pack-order in app.js
 * Retrieves all pack orders
 */
router.get("/", packOrderController.getAllPackOrders);

/**
 * Route: GET /:orderCode
 * Mapped to /api/v1/pack-order/:orderCode in app.js
 * Retrieves a specific pack order by orderCode
 */
router.get("/:orderCode", packOrderController.getPackOrderByOrderCode);

module.exports = router;
