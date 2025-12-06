const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrderRequest, validatePagination } = require('../middlewares/validateRequest');

// Create routes
router.post('/', validateOrderRequest, orderController.createOrder);
router.post('/bulk', orderController.bulkCreateOrders);

// Read routes - Stats (must come before :orderCode)
router.get('/stats', orderController.getOrderStats);

// Read routes - SKU search (must come before :orderCode)
router.get('/sku/:skuCode', validatePagination, orderController.getOrdersBySku);

// Read routes - All orders
router.get('/', validatePagination, orderController.getAllOrders);

// Read routes - Single order

router.get('/:orderCode', orderController.getOrder);
router.get('/params', orderController.getOrderByQuery);
router.get('/:orderCode/items', validatePagination, orderController.getOrderItems);
router.get('/date/:date', orderController.getOrderByDate);


// Read routes - Partner orders
router.get('/partner/:partnerCode', validatePagination, orderController.getOrdersByPartner);

// Update routes
router.put('/:orderCode', orderController.updateOrder);
router.put('/:orderCode/items/:orderItemCode', orderController.updateOrderItem);
router.patch('/:orderCode/status', orderController.updateOrderStatus);
router.patch('/bulk/status', orderController.bulkUpdateStatus);

// Add item route
router.post('/:orderCode/items', orderController.addItemToOrder);

// Delete routes
router.delete('/:orderCode/items/:orderItemCode', orderController.deleteOrderItem);
router.delete('/:orderCode', orderController.deleteOrder);

module.exports = router;
