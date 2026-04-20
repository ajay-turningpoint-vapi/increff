const ApiError = require('../utils/ApiError');

const validatePackOrder = (req, res, next) => {
  const payload = req.body;
  
  if (!payload) {
    return next(new ApiError(400, 'Request body is missing'));
  }

  const { orderCode, locationCode, shipmentId, invoice, shipmentItems } = payload;

  // Root level mandatory fields
  if (!orderCode || typeof orderCode !== 'string') {
    return next(new ApiError(400, 'orderCode is required and must be a string'));
  }
  if (!locationCode || typeof locationCode !== 'string') {
    return next(new ApiError(400, 'locationCode is required and must be a string'));
  }
  if (shipmentId === undefined || typeof shipmentId !== 'number') {
    return next(new ApiError(400, 'shipmentId is required and must be a number/long'));
  }

  // Invoice validation
  if (!invoice || typeof invoice !== 'object') {
    return next(new ApiError(400, 'invoice is required and must be an object'));
  }

  const validateAddress = (address, addressName, isMandatory = true) => {
    if (!address) {
      if (isMandatory) return `${addressName} is required`;
      return null;
    }
    if (!address.name) return `${addressName}.name is required`;
    if (!address.line1) return `${addressName}.line1 is required`;
    if (!address.city) return `${addressName}.city is required`;
    if (!address.state) return `${addressName}.state is required`;
    if (!address.zip) return `${addressName}.zip is required`;
    if (!address.country) return `${addressName}.country is required`;
    if (!address.email) return `${addressName}.email is required`;
    return null;
  };

  const fromAddressErr = validateAddress(invoice.fromAddress, 'invoice.fromAddress', false);
  if (fromAddressErr) return next(new ApiError(400, fromAddressErr));

  const shippingAddressErr = validateAddress(invoice.shippingAddress, 'invoice.shippingAddress', true);
  if (shippingAddressErr) return next(new ApiError(400, shippingAddressErr));

  const billingAddressErr = validateAddress(invoice.billingAddress, 'invoice.billingAddress', true);
  if (billingAddressErr) return next(new ApiError(400, billingAddressErr));

  // Shipment Items validation
  if (!shipmentItems || !Array.isArray(shipmentItems) || shipmentItems.length === 0) {
    return next(new ApiError(400, 'shipmentItems is required and must be a non-empty array'));
  }

  for (let i = 0; i < shipmentItems.length; i++) {
    const item = shipmentItems[i];
    if (!item.channelSkuCode) {
      return next(new ApiError(400, `shipmentItems[${i}].channelSkuCode is required`));
    }
    if (item.quantity === undefined || typeof item.quantity !== 'number') {
      return next(new ApiError(400, `shipmentItems[${i}].quantity is required and must be a number`));
    }
    if (!item.orderItemCode) {
      return next(new ApiError(400, `shipmentItems[${i}].orderItemCode is required`));
    }
  }

  next();
};

module.exports = validatePackOrder;
