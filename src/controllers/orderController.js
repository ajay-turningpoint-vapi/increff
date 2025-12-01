const orderService = require("../services/orderService");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../middlewares/asyncHandler");

// POST /api/v1/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

// GET /api/v1/orders/:orderCode?includeItems=true
exports.getOrder = asyncHandler(async (req, res) => {
  const { includeItems = "true" } = req.query;
  const data = await orderService.getOrder(
    req.params.orderCode,
    includeItems === "true"
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, "Order fetched successfully"));
});

// GET /api/v1/orders/:orderCode/items?page=1&limit=50
exports.getOrderItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const data = await orderService.getOrderItems(
    req.params.orderCode,
    parseInt(page),
    parseInt(limit)
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, "Order items fetched successfully"));
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    page = 1,
    limit = 50,
    includeItems = "true",
  } = req.query;

  // Validate dates format if provided
  const dateFormat = /^\d{4}\/\d{2}\/\d{2}$/;
  if (startDate && !dateFormat.test(startDate)) {
    return res.status(400).json({
      success: false,
      message: "Invalid startDate format, expected YYYY/MM/DD",
    });
  }
  if (endDate && !dateFormat.test(endDate)) {
    return res.status(400).json({
      success: false,
      message: "Invalid endDate format, expected YYYY/MM/DD",
    });
  }

  const result = await orderService.getAllOrders(
    { startDate, endDate },
    parseInt(page),
    parseInt(limit),
    includeItems === "true"
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Orders retrieved successfully"));
});
