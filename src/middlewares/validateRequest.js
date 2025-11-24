const ApiError = require('../utils/ApiError');

/**
 * Validate order creation request
 */
const validateOrderRequest = (req, res, next) => {
  const { 
    orderCode, 
    partnerCode, 
    partnerLocationCode,
    locationCode, 
    messageId, 
    items 
  } = req.body;

  const errors = [];

  // Required string fields
  if (!orderCode || typeof orderCode !== 'string') {
    errors.push('orderCode is required and must be a string');
  }

  if (!partnerCode || typeof partnerCode !== 'string') {
    errors.push('partnerCode is required and must be a string');
  }

  if (!partnerLocationCode || typeof partnerLocationCode !== 'string') {
    errors.push('partnerLocationCode is required and must be a string');
  }

  if (!locationCode || typeof locationCode !== 'string') {
    errors.push('locationCode is required and must be a string');
  }

  // Required number field
  if (!messageId || typeof messageId !== 'number') {
    errors.push('messageId is required and must be a number');
  }

  // Items validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items is required and must be a non-empty array');
  } else {
    items.forEach((item, index) => {
      if (!item.channelSkuCode) {
        errors.push(`items[${index}].channelSkuCode is required`);
      }
      
      if (typeof item.qcPassAbsoluteQuantity !== 'number') {
        errors.push(`items[${index}].qcPassAbsoluteQuantity must be a number`);
      } else if (item.qcPassAbsoluteQuantity < 0) {
        errors.push(`items[${index}].qcPassAbsoluteQuantity cannot be negative`);
      }

      if (typeof item.qcFailAbsoluteQuantity !== 'number') {
        errors.push(`items[${index}].qcFailAbsoluteQuantity must be a number`);
      } else if (item.qcFailAbsoluteQuantity < 0) {
        errors.push(`items[${index}].qcFailAbsoluteQuantity cannot be negative`);
      }

      if (typeof item.qcPassDeltaQuantity !== 'number') {
        errors.push(`items[${index}].qcPassDeltaQuantity must be a number`);
      }

      if (typeof item.qcFailDeltaQuantity !== 'number') {
        errors.push(`items[${index}].qcFailDeltaQuantity must be a number`);
      }
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    throw new ApiError(400, 'Page must be a positive number');
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    throw new ApiError(400, 'Limit must be between 1 and 100');
  }

  next();
};

module.exports = { 
  validateOrderRequest,
  validatePagination
};
