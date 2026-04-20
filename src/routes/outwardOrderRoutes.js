// const express = require('express');
// const router = express.Router();
// const outwardOrderController = require('../controllers/outwardOrderController');
// const validateOutwardOrder = require('../middlewares/validateOutwardOrder');

// // Create outward order
// router.post('/', validateOutwardOrder, outwardOrderController.createOrder);

// // Get a single outward order (optionally with items)
// router.get('/:orderCode', outwardOrderController.getOrder);

// // Get only items for an outward order (paginated)
// router.get('/:orderCode/items', outwardOrderController.getOrderItems);

// // List outward orders with filters
// router.get('/', outwardOrderController.listOrders);


// router.get('/date/:date', outwardOrderController.getOutwardOrderByDate);

// module.exports = router;




const express = require('express');
const router = express.Router();
const outwardOrderController = require('../controllers/outwardOrderController');
const validateOutwardOrder = require('../middlewares/validateOutwardOrder');

// 1. Create outward order
router.post('/', validateOutwardOrder, outwardOrderController.createOrder);

// 2. List outward orders with filters
// (This is fine where it is, as the path is exactly '/')
router.get('/', outwardOrderController.listOrders);

// 3. Get outward orders by date
// MUST be placed BEFORE the /:orderCode route.
// Added (*) to capture the slashes in YYYY/MM/DD format.
// MUST still be placed BEFORE the /:orderCode route
router.get('/date/:year/:month/:day', outwardOrderController.getOutwardOrderByDate);

// 4. Get a single outward order (Items are now always included natively)
router.get('/:orderCode', outwardOrderController.getOrder);

// 5. Get only items for an outward order (paginated)
router.get('/:orderCode/items', outwardOrderController.getOrderItems);

module.exports = router;