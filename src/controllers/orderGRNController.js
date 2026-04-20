const orderService = require("../services/orderGRNService");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../middlewares/asyncHandler");
const moment = require("moment-timezone");
const { sendVoucherToBusy } = require("../services/busy.service");
// Create order
exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

// Bulk create orders
exports.bulkCreateOrders = asyncHandler(async (req, res) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "orders array is required and must not be empty",
        ),
      );
  }

  const result = await orderService.bulkCreateOrders(orders);
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        `${result.length} orders created successfully`,
      ),
    );
});

// Get order by code
exports.getOrder = asyncHandler(async (req, res) => {
  const { orderCode, includeItems = "true" } = req.query;
  const order = await orderService.getOrderByCode(
    orderCode,
    includeItems === "true",
  );
  res
    .status(200)
    .json(new ApiResponse(200, order, "Order retrieved successfully"));
});

// Manually resend an order to BUSY by orderCode
exports.syncOrderToBusy = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;

  const order = await orderService.getOrderByCode(orderCode, true);
  const payload = {
    order,
    items: order.items || [],
  };

  const busyResult = await sendVoucherToBusy(payload);

  res.status(200).json(
    new ApiResponse(200, { order, busyResult }, "Order synced to BUSY"),
  );
});

exports.getOrderByQuery = asyncHandler(async (req, res) => {
  const { orderCode, includeItems = "true" } = req.query;
  console.log("query", req.query);

  if (!orderCode) {
    return res
      .status(400)
      .json({ message: "orderCode is required in query params" });
  }

  const order = await orderService.getOrderByCode(
    orderCode,
    includeItems === "true",
  );

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order retrieved successfully"));
});

// Get order by date
exports.getOrderByDate = asyncHandler(async (req, res) => {
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
  const orders = await orderService.getOrderByDate(date, includeItemsFlag);

  res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
});

// Get order items (paginated)
exports.getOrderItems = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await orderService.getOrderItems(
    orderCode,
    parseInt(page),
    parseInt(limit),
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Order items retrieved successfully"));
});

// Get all orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    partnerCode,
    locationCode,
    status,
    includeItems = "true",
  } = req.query;

  const filters = {};
  if (partnerCode) filters.partnerCode = partnerCode;
  if (locationCode) filters.locationCode = locationCode;
  if (status) filters.status = status;

  const result = await orderService.getAllOrders(
    parseInt(page),
    parseInt(limit),
    filters,
    includeItems === "true",
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Orders retrieved successfully"));
});

// Get orders by partner
exports.getOrdersByPartner = asyncHandler(async (req, res) => {
  const { partnerCode } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await orderService.getOrdersByPartner(
    partnerCode,
    parseInt(page),
    parseInt(limit),
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Partner orders retrieved successfully"),
    );
});

// Get orders by SKU
exports.getOrdersBySku = asyncHandler(async (req, res) => {
  const { skuCode } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await orderService.getOrdersBySku(
    skuCode,
    parseInt(page),
    parseInt(limit),
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "SKU orders retrieved successfully"));
});

// Update order
exports.updateOrder = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const order = await orderService.updateOrder(orderCode, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, order, "Order updated successfully"));
});

// Update order item
exports.updateOrderItem = asyncHandler(async (req, res) => {
  const { orderCode, orderItemCode } = req.params;
  const item = await orderService.updateOrderItem(
    orderCode,
    orderItemCode,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, item, "Order item updated successfully"));
});

// Add item to order
exports.addItemToOrder = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const item = await orderService.addItemToOrder(orderCode, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, item, "Item added to order successfully"));
});

// Delete order item
exports.deleteOrderItem = asyncHandler(async (req, res) => {
  const { orderCode, orderItemCode } = req.params;
  const item = await orderService.deleteOrderItem(orderCode, orderItemCode);
  res
    .status(200)
    .json(new ApiResponse(200, item, "Order item deleted successfully"));
});

// Update order status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const { status } = req.body;

  if (!status) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Status is required"));
  }

  const order = await orderService.updateOrderStatus(orderCode, status);
  res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

// Bulk update status
exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { orderCodes, status } = req.body;

  if (!orderCodes || !Array.isArray(orderCodes) || orderCodes.length === 0) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "orderCodes array is required and must not be empty",
        ),
      );
  }

  if (!status) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "status is required"));
  }

  const result = await orderService.bulkUpdateStatus(orderCodes, status);
  res
    .status(200)
    .json(
      new ApiResponse(200, result, `${result.modifiedCount} orders updated`),
    );
});

// Delete order
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { orderCode } = req.params;
  const result = await orderService.deleteOrder(orderCode);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Order and items deleted successfully"));
});

// Get order statistics
exports.getOrderStats = asyncHandler(async (req, res) => {
  const { partnerCode } = req.query;
  const stats = await orderService.getOrderStats(partnerCode);
  res
    .status(200)
    .json(
      new ApiResponse(200, stats, "Order statistics retrieved successfully"),
    );
});
