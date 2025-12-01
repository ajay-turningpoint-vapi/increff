const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create order with orderItems + gateEntryLevelBoxSkuDetails
router.post('/', orderController.createOrder);

// Get order (optionally with items)
router.get('/:orderCode', orderController.getOrder);

// Paginated items
router.get('/:orderCode/items', orderController.getOrderItems);

// GET /api/v1/orders
router.get('/', orderController.getAllOrders);


module.exports = router;
