const invoiceService = require('../services/invoiceService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

exports.createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body);
  res.status(201).json(new ApiResponse(201, invoice, 'Invoice created successfully'));
});

exports.getInvoice = asyncHandler(async (req, res) => {
  const { includeItems = 'true' } = req.query;
  const invoice = await invoiceService.getInvoice(
    parseInt(req.params.invoiceId),
    includeItems === 'true'
  );
  res.status(200).json(new ApiResponse(200, invoice, 'Invoice retrieved successfully'));
});


exports.getAllInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, includeItems = 'false' } = req.query;

  const result = await invoiceService.getAllInvoices(
    parseInt(page),
    parseInt(limit),
    includeItems === 'true'
  );

  res.status(200).json(
    new ApiResponse(200, result, 'Invoices retrieved successfully')
  );
});