// // src/middlewares/validateOutwardOrder.js
// const ApiError = require('../utils/ApiError');

// module.exports = function validateOutwardOrder(req, res, next) {
//   const { orderItems } = req.body;

//   if (!Array.isArray(orderItems) || orderItems.length === 0) {
//     throw new ApiError(400, 'orderItems must be a non-empty array');
//   }

//   if (orderItems.length > 2500) {
//     throw new ApiError(400, `orderItems cannot exceed 2500. Received: ${orderItems.length}`);
//   }

//   const codes = orderItems.map(i => i.orderItemCode);
//   const uniqueCodes = new Set(codes);
//   if (uniqueCodes.size !== codes.length) {
//     throw new ApiError(400, 'orderItemCode must be unique in orderItems');
//   }

//   next();
// };




// src/middlewares/validateOutwardOrder.js
const ApiError = require('../utils/ApiError');

module.exports = function validateOutwardOrder(req, res, next) {
  const payload = req.body;
  const { 
    orderItems, 
    messageId, 
    orderCode, 
    partnerCode, 
    locationCode 
  } = payload;

  // 1. Critical Top-Level Validations
  if (!messageId) {
    throw new ApiError(400, 'messageId is mandatory for idempotency checks.');
  }
  if (!orderCode) {
    throw new ApiError(400, 'orderCode is mandatory.');
  }
  if (!partnerCode) {
    throw new ApiError(400, 'partnerCode is mandatory.');
  }
  if (!locationCode) {
    throw new ApiError(400, 'locationCode is mandatory.');
  }

  // 2. Order Items Validation
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ApiError(400, 'orderItems must be a non-empty array');
  }

  if (orderItems.length > 2500) {
    throw new ApiError(400, `orderItems cannot exceed 2500. Received: ${orderItems.length}`);
  }

  const codes = orderItems.map(i => i.orderItemCode).filter(Boolean); // filter out undefined/null just in case
  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) {
    throw new ApiError(400, 'orderItemCode must be unique in orderItems');
  }

  next();
};