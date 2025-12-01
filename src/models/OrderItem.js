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

const orderItemSchema = new Schema({
  orderCode: { type: String, required: true, index: true },
  orderItemCode: { type: String, index: true, sparse: true },
  channelSkuCode: { type: String, required: true, index: true },
  qcPassQuantity: { type: Number, required: true, min: 0 },
  qcFailQuantity: { type: Number, required: true, min: 0 },
  orderItemCustomAttributes: { type: orderItemCustomAttributesSchema, default: null }
}, {
  timestamps: true,
  collection: 'order_items'
});

orderItemSchema.index({ orderCode: 1, channelSkuCode: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
