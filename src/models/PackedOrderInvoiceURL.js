const mongoose = require('mongoose');
const { Schema } = mongoose;

const packedOrderInvoiceURL = new Schema({
  invoiceCode: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  invoiceUrl: { type: String, required: true },
}, { timestamps: true, collection: 'busy_invoices' });

module.exports = mongoose.model('PackedOrderInvoiceURL', packedOrderInvoiceURL);
