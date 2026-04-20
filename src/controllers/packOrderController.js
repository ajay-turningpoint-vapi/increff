const packOrderService = require("../services/packOrderService");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * POST /api/v1/pack-order
 * Handles the Pack Notification webhook from Increff OMS
 */
exports.packOrder = asyncHandler(async (req, res) => {
  const result = await packOrderService.processPackNotification(req.body);

  // Returning the raw result as Increff expects a specific JSON structure 
  // for successful webhook acknowledgment.
  res.status(200).json(result);
});

/**
 * GET /api/v1/pack-order
 * Retrieves all pack orders
 */
exports.getAllPackOrders = asyncHandler(async (req, res) => {
  const packOrders = await packOrderService.getAllPackOrders();
  res.status(200).json({ success: true, data: packOrders });
});

/**
 * GET /api/v1/pack-order/:orderCode
 * Retrieves a pack order by order code
 */
exports.getPackOrderByOrderCode = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const packOrder = await packOrderService.getPackOrderByOrderCode(orderCode);
  
  if (!packOrder) {
    return res.status(404).json({ success: false, message: 'Pack order not found' });
  }

  res.status(200).json({ success: true, data: packOrder });
});
