const packedOrderInvoiceService = require('../services/packedOrderInvoiceService');
const asyncHandler = require('../middlewares/asyncHandler');

exports.createPackedOrderInvoice = asyncHandler(async (req, res) => {
  const { invoiceCode } = req.body;
  
  if (!invoiceCode) {
    return res.status(400).json({ error: "invoiceCode is required" });
  }

  const invoice = await packedOrderInvoiceService.createPackedOrderInvoice(req.body);
  res.status(200).json(invoice);
});

exports.getPackedOrderInvoice = asyncHandler(async (req, res) => {
  // Check both query and body to be flexible
  const payload = Object.keys(req.query).length > 0 ? req.query : req.body;
  const { invoiceCode, shipmentCode, orderCode } = payload;

  // shipmentCode or orderCode are treated equivalent to invoiceCode
  const targetInvoiceCode = invoiceCode || shipmentCode || orderCode;

  if (!targetInvoiceCode) {
    return res.status(400).json({ error: "invoiceCode, shipmentCode, or orderCode must be provided" });
  }

  const invoice = await packedOrderInvoiceService.getPackedOrderInvoice(targetInvoiceCode);

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  // Omit internal fields before complying with the expected API response
  const response = invoice.toJSON();
  delete response._id;
  delete response.__v;
  delete response.createdAt;
  delete response.updatedAt;

  res.status(200).json(response);
});
