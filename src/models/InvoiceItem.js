const mongoose = require("mongoose");
const { Schema } = mongoose;

const invoiceItemSchema = new Schema(
  {
    invoiceId: { type: Number, required: true, index: true },
    orderCode: { type: String, required: true, index: true },
    orderItemCode: String,
    channelSkuCode: { type: String, required: true, index: true },
    qcPassAbsoluteQuantity: { type: Number, required: true, min: 0 },
    qcFailAbsoluteQuantity: { type: Number, required: true, min: 0 },
    qcFailDeltaQuantity: { type: Number, required: true },
    qcPassDeltaQuantity: { type: Number, required: true },
    orderItemCustomAttributes: { type: Schema.Types.Mixed, default: null },
  },
  { collection: "invoice_items", timestamps: true }
);

invoiceItemSchema.index({ invoiceId: 1, channelSkuCode: 1 });

module.exports = mongoose.model("InvoiceItem", invoiceItemSchema);
