const ApiError = require('../utils/ApiError');

const validateOrderRequest = (req, res, next) => {
  const { orderCode, partnerCode, locationCode, messageId, items } = req.body;

  const errors = [];

  if (!orderCode || typeof orderCode !== 'string') {
    errors.push('orderCode is required and must be a string');
  }

  if (!partnerCode || typeof partnerCode !== 'string') {
    errors.push('partnerCode is required and must be a string');
  }

  if (!locationCode || typeof locationCode !== 'string') {
    errors.push('locationCode is required and must be a string');
  }

  if (!messageId || typeof messageId !== 'number') {
    errors.push('messageId is required and must be a number');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items is required and must be a non-empty array');
  } else {
    items.forEach((item, index) => {
      if (!item.channelSkuCode) {
        errors.push(`items[${index}].channelSkuCode is required`);
      }
      if (typeof item.qcPassAbsoluteQuantity !== 'number' || item.qcPassAbsoluteQuantity < 0) {
        errors.push(`items[${index}].qcPassAbsoluteQuantity must be a non-negative number`);
      }
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

module.exports = { validateOrderRequest };
