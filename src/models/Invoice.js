const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
  invoiceId: { type: Number, required: true, unique: true },
  invoiceCode: { type: String, required: true },
  invoiceDocumentUrl: { type: String, required: true },
  stateTaxDocumentUrl: { type: String, required: true },
  shippingLabelDocumentUrl: { type: String, required: true },
  transporter: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  gateEntryCreatedAt: { type: Date, required: true },
  externalInvoiceDate: { type: Date, required: true },
  awbNumber: { type: String, required: true },
  gateEntryId: { type: Number, required: true },
  messageId: { type: Number, required: true },
  orderCode: { type: String, required: true, index: true },
  orderType: { type: String, required: true },
  locationCode: { type: String, required: true },
  billOfEntry: String,
  entryDeclarationNumber: String,
  parentOrderCode: { type: String, required: true },
  partnerCode: { type: String, required: true },
  partnerLocationCode: { type: String, required: true },
  asnCode: String,
  generatedAsnId: String,
  orderCustomAttributes: { type: Schema.Types.Mixed, default: null },
  itemCount: { type: Number, default: 0 }
}, { timestamps: true, collection: 'invoices' });

invoiceSchema.index({ orderCode: 1, invoiceId: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
