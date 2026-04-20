const express = require('express');
const {
  createInwardOrder,
  getAllInwardOrders,
  getInwardOrderByOrderItemCode,
  syncInwardByOrderItemCode,
} = require('../controllers/inwardOrder.controller');

const router = express.Router();

router.post('/', createInwardOrder);
router.get('/', getAllInwardOrders);

// GET /orders/inward/item/:orderItemCode
// Retrieves a specific order that contains the matching orderItemCode
router.get('/inward/item/:orderItemCode', getInwardOrderByOrderItemCode);

// POST /orders/inward/item/:orderItemCode/sync-busy
// Sends the specific inward line to BUSY
router.post('/inward/item/:orderItemCode/sync-busy', syncInwardByOrderItemCode);

module.exports = router;