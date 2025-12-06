// src/models/OutwardOrderItem.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const channelMetadataSchema = new Schema({
  totalCashOnDeliveryFee: { type: Number, default: 0 },
  department: { type: String, trim: true },
  paymentMethod: { type: String, trim: true },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'pending'],
    default: 'processing'
  }
}, { _id: false });

const orderItemCustomAttributesSchema = new Schema({
  attribute1: String,
  attribute2: String,
  attribute3: String,
  attribute4: String,
  attribute5: String,
  attribute6: String,
  attribute7: String,
  attribute8: String,
  attribute9: String,
  attribute10: String,
  channelMeta :channelMetadataSchema
}, { _id: false, strict: false });

const outwardOrderItemSchema = new Schema({
  orderCode: { type: String, required: true, index: true },
  channelSkuCode: { type: String, required: true, index: true },
  orderItemCode: { type: String, required: true }, // must be unique within an order
  quantity: { type: Number, required: true, min: 1 },
  sellerDiscountPerUnit: { type: Number, default: 0 },
  channelDiscountPerUnit: { type: Number, default: 0 },
  sellingPricePerUnit: { type: Number, required: true, min: 0 },
  shippingChargePerUnit: { type: Number, default: 0 },
  minExpiry: { type: Date },
  giftOptions: {
    giftwrapRequired: { type: Boolean, default: false },
    giftMessage: { type: String },
    giftChargePerUnit: { type: Number, default: 0 },
    giftDocument: { type: String },
    giftDocumentFormat: { type: String, enum: ['PDF', 'ZPL', 'PNG'], default: 'PDF' }
  },
  orderItemCustomAttributes: { type: orderItemCustomAttributesSchema, default: null }
}, {
  timestamps: true,
  collection: 'outward_order_items'
});

// (Optional) compound index useful for lookups
outwardOrderItemSchema.index({ orderCode: 1, orderItemCode: 1 });

module.exports = mongoose.model('OutwardOrderItem', outwardOrderItemSchema);
