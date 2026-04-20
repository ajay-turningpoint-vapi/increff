const inwardOrderService = require('../services/inwardOrder.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const { sendInwardOrderToBusy } = require('../services/busy.service');


const createInwardOrder = asyncHandler(async (req, res) => {
    const payload = req.body;
    const createdOrder = await inwardOrderService.createOrder(payload);

    return res.status(201).json(
        new ApiResponse(201, createdOrder, 'Inward order created successfully')
    );
});

// NEW: Controller to get all orders
const getAllInwardOrders = asyncHandler(async (req, res) => {
    const orders = await inwardOrderService.getAllOrders();

    return res.status(200).json(
        new ApiResponse(200, orders, 'Orders retrieved successfully')
    );
});

// NEW: Controller to get an order by orderItemCode
const getInwardOrderByOrderItemCode = asyncHandler(async (req, res) => {
    // Extract the parameter from the URL
    const { orderItemCode } = req.params; 
    
    const order = await inwardOrderService.getOrderByOrderItemCode(orderItemCode);

    return res.status(200).json(
        new ApiResponse(200, order, 'Order retrieved successfully')
    );
});

// NEW: Manually sync a specific inward line (by orderItemCode) to BUSY
const syncInwardByOrderItemCode = asyncHandler(async (req, res) => {
    const { orderItemCode } = req.params;

    const order = await inwardOrderService.getOrderByOrderItemCode(orderItemCode);
    const item = (order.orderItems || []).find(
        (it) => it.orderItemCode === orderItemCode
    );

    if (!item) {
        return res.status(404).json(
            new ApiResponse(404, null, `Item with orderItemCode '${orderItemCode}' not found in order`)
        );
    }

    const payload = {
        order,
        items: [item],
    };

    const busyResult = await sendInwardOrderToBusy(payload);

    return res.status(200).json(
        new ApiResponse(200, { order, item, busyResult }, 'Inward line synced to BUSY')
    );
});

module.exports = {
    createInwardOrder,
    getAllInwardOrders,
    getInwardOrderByOrderItemCode,
    syncInwardByOrderItemCode,
};