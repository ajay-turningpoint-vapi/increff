const express = require('express');
const router = express.Router();
const outwardOrderController = require('../controllers/outwardOrderController');
const validateOutwardOrder = require('../middlewares/validateOutwardOrder');

// Create outward order
router.post('/', validateOutwardOrder, outwardOrderController.createOrder);

// Get a single outward order (optionally with items)
router.get('/:orderCode', outwardOrderController.getOrder);

// Get only items for an outward order (paginated)
router.get('/:orderCode/items', outwardOrderController.getOrderItems);

// List outward orders with filters
router.get('/', outwardOrderController.listOrders);


router.get('/date/:date', outwardOrderController.getOutwardOrderByDate);

module.exports = router;
