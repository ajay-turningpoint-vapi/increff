const express = require("express");
const multer = require("multer");
const InventoryJob = require("../models/InventoryJob");
const { processExcel } = require("../utils/excelProcessor");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const invoiceController = require('../controllers/invoiceController');

router.post('/', invoiceController.createInvoice);
router.get('/:invoiceId', invoiceController.getInvoice);
router.get('/', invoiceController.getAllInvoices);

// router.post("/upload", upload.single("file"), async (req, res) => {
//   const job = await InventoryJob.create({ status: "IN_PROGRESS" });

//   const totalRows = await processExcel(req.file.path, job._id);

//   job.totalRows = totalRows;
//   await job.save();

//   res.json({
//     jobId: job._id,
//     totalRows
//   });
// });

module.exports = router;
