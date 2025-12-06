const outwardOrderService = require('../services/outwardOrderService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const moment = require('moment-timezone');

// POST /orders/outward/partner-code
exports.createOrder = asyncHandler(async (req, res) => {
  const order = await outwardOrderService.createOrder(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, order, 'Outward order created successfully'));
});

// GET /orders/outward/:orderCode?includeItems=true
exports.getOrder = asyncHandler(async (req, res) => {
  const { includeItems = 'true' } = req.query;
  const data = await outwardOrderService.getOrder(
    req.params.orderCode,
    includeItems === 'true'
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, 'Outward order fetched successfully'));
});

// GET /orders/outward/:orderCode/items?page=1&limit=50
exports.getOrderItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const data = await outwardOrderService.getOrderItems(
    req.params.orderCode,
    parseInt(page),
    parseInt(limit)
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, 'Outward order items fetched successfully'));
});

// GET /orders/outward?partnerCode=..&locationCode=..&page=1&limit=50
exports.listOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, partnerCode, locationCode, orderType } = req.query;

  const filters = {};
  if (partnerCode) filters.partnerCode = partnerCode;
  if (locationCode) filters.locationCode = locationCode;
  if (orderType) filters.orderType = orderType;

  const data = await outwardOrderService.listOrders(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res
    .status(200)
    .json(new ApiResponse(200, data, 'Outward orders fetched successfully'));
});







exports.getOutwardOrderByDate = asyncHandler(async (req, res) => {
  const { date } = req.params; // expects route like: /orders/date/:date  (date -> YYYY/MM/DD)
  const { includeItems = "true" } = req.query;

  // basic presence check
  if (!date) {
    throw new ApiError(400, "Date parameter is required. Use YYYY/MM/DD");
  }

  // validate date format (using Asia/Kolkata timezone)
  const m = moment.tz(date, "YYYY/MM/DD", "Asia/Kolkata");
  if (!m.isValid()) {
    throw new ApiError(400, "Invalid date format. Expected YYYY/MM/DD");
  }

  // parse includeItems boolean
  const includeItemsFlag = String(includeItems).toLowerCase() === "true";

  // call service (service expects dateString in YYYY/MM/DD format)
  const orders = await outwardOrderService.getOutwardOrderByDate(date, includeItemsFlag);

  res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});
