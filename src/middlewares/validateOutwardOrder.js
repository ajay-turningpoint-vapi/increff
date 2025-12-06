// src/middlewares/validateOutwardOrder.js
const ApiError = require('../utils/ApiError');

module.exports = function validateOutwardOrder(req, res, next) {
  const { orderItems } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ApiError(400, 'orderItems must be a non-empty array');
  }

  if (orderItems.length > 2500) {
    throw new ApiError(400, `orderItems cannot exceed 2500. Received: ${orderItems.length}`);
  }

  const codes = orderItems.map(i => i.orderItemCode);
  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) {
    throw new ApiError(400, 'orderItemCode must be unique in orderItems');
  }

  next();
};
