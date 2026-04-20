const InwardOrder = require('../models/inwardOrder');
const ApiError = require('../utils/ApiError');
const { emitSyncEventBusy } = require('../utils/emitSyncEventBusy');

const createOrder = async (orderPayload) => {
    const existingOrder = await InwardOrder.findOne({ orderCode: orderPayload.orderCode });
    if (existingOrder) {
        throw new ApiError(409, `Order with orderCode '${orderPayload.orderCode}' already exists.`);
    }

    const newOrder = new InwardOrder(orderPayload);
    const savedOrder = await newOrder.save();

    await emitSyncEventBusy('INWARD_CREATED', {
        order: savedOrder,
        items: savedOrder.orderItems || []
    });

    return savedOrder;
};

// NEW: Get all orders
const getAllOrders = async () => {
    // You can later add pagination (.skip() and .limit()) here if your database grows large
    const orders = await InwardOrder.find();
    return orders;
};

// NEW: Get an order by a specific orderItemCode nested in the orderItems array
const getOrderByOrderItemCode = async (orderItemCode) => {
    // Use dot notation to search inside an array of objects
    const order = await InwardOrder.findOne({ "orderItems.orderItemCode": orderItemCode });
    
    if (!order) {
        throw new ApiError(404, `Order containing orderItemCode '${orderItemCode}' not found.`);
    }
    
    return order;
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderByOrderItemCode
};