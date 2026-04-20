const express = require('express');
const router = express.Router();
const packedOrderInvoiceController = require('../controllers/packedOrderInvoiceController');

router.get('/', packedOrderInvoiceController.getPackedOrderInvoice);
router.post('/', packedOrderInvoiceController.createPackedOrderInvoice);

module.exports = router;
