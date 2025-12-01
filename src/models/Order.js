const mongoose = require('mongoose');
const { Schema } = mongoose;

// ----- Sub-schemas -----
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

const orderCustomAttributesSchema = new Schema({
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
  channelMeta :channelMetadataSchema,
  currency: { type: String, default: 'INR' }
}, { _id: false, strict: false });

// Box-level nested structures
const skuQtyDetailsSchema = new Schema({
  channelSkuCode: { type: String, required: true },
  qcPassQty: { type: Number, default: 0 },
  qcFailQty: { type: Number, default: 0 }
}, { _id: false });

const boxSkuQtyDataSchema = new Schema({
  boxCode: { type: String, required: true },
  purpose: { type: String, enum: ['CROSS_DOCK', 'STORAGE', 'STORAGE', 'STORAGE'], default: 'STORAGE' },
  skuQtyDetails: { type: [skuQtyDetailsSchema], default: [] }
}, { _id: false });

const simpleItemRefSchema = new Schema({
  channelSkuCode: { type: String, required: true },
  itemCode: { type: String, required: true }
}, { _id: false });

const gateEntryLevelBoxSkuDetailsSchema = new Schema({
  boxSkuQtyData: { type: [boxSkuQtyDataSchema], default: [] },
  missingItems: { type: [simpleItemRefSchema], default: [] },
  extraItems: { type: [simpleItemRefSchema], default: [] }
}, { _id: false, strict: false });

// ----- Order schema -----
const orderSchema = new Schema({
  orderCode: { type: String, required: true, unique: true, index: true },
  orderType: { type: String, required: true }, // PO/STO/RO/...
  partnerCode: { type: String, required: true, index: true },
  partnerLocationCode: { type: String, required: true },
  locationCode: { type: String, required: true, index: true },
  messageId: { type: Number, required: true },
  parentOrderCode: { type: String, required: true, index: true },
  itemCount: { type: Number, default: 0 },
  orderCustomAttributes: orderCustomAttributesSchema,
  gateEntryLevelBoxSkuDetails: gateEntryLevelBoxSkuDetailsSchema
}, {
  timestamps: true,
  collection: 'orders'
});

// Indexes
orderSchema.index({ partnerCode: 1, locationCode: 1 });
orderSchema.index({ orderType: 1, createdAt: -1 });
orderSchema.index({ messageId: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
