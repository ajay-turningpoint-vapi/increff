const mongoose = require('mongoose');
const { Schema } = mongoose;

const taxItemSchema = new Schema({
  type: { type: String, required: true },
  rate: { type: Number, required: true },
  taxPerUnit: { type: Number, required: true },
  taxTotal: { type: Number, required: true }
}, { _id: false });

const invoiceDetailSchema = new Schema({
  channelSkuCode: { type: String, required: true },
  orderItemCode: { type: String },
  netTaxAmountPerUnit: { type: Number, required: true },
  netTaxAmountTotal: { type: Number, required: true },
  baseSellingPricePerUnit: { type: Number, required: true },
  baseSellingPriceTotal: { type: Number, required: true },
  actualSellingPricePerUnit: { type: Number, required: true },
  actualSellingPriceTotal: { type: Number, required: true },
  quantity: { type: Number, required: true },
  taxItems: { type: [taxItemSchema], required: true },
  orderItemCustomAttributes: { type: Schema.Types.Mixed, default: null }
}, { _id: false });

const packedOrderInvoiceSchema = new Schema({
  invoiceCode: { type: String, required: true, unique: true },
  invoiceUrl: { type: String }, // either of invoice and invoiceUrl is mandatory based on requirement
  irn: { type: String },
  qrCode: { type: String },
  invoiceDate: { type: Date, required: true },
  invoice: { type: String }, // Base64 encoded string
  orderCustomAttributes: { type: Schema.Types.Mixed, default: null },
  invoiceDetails: { type: [invoiceDetailSchema], default: [] }
}, { timestamps: true, collection: 'packed_order_invoices' });

module.exports = mongoose.model('PackedOrderInvoice', packedOrderInvoiceSchema);
