const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrderRequest } = require('../middlewares/validateRequest');

// Create routes
router.post('/', validateOrderRequest, orderController.createOrder);
router.post('/bulk', orderController.bulkCreateOrders);

// Read routes
router.get('/', orderController.getAllOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/:orderCode', orderController.getOrder);
router.get('/partner/:partnerCode', orderController.getOrdersByPartner);
router.get('/sku/:skuCode', orderController.getOrdersBySku);

// Update routes
router.put('/:orderCode', orderController.updateOrder);
router.patch('/:orderCode/status', orderController.updateOrderStatus);
router.patch('/bulk/status', orderController.bulkUpdateStatus);

// Delete routes
router.delete('/:orderCode', orderController.deleteOrder);

module.exports = router;
