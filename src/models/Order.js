const mongoose = require('mongoose');
const { Schema } = mongoose;

const channelMetadataSchema = new Schema({
  totalCashOnDeliveryFee: { type: Number, default: 0 },
  department: { type: String, trim: true },
  paymentMethod: { type: String, trim: true },
  status: { 
    type: String, 
    index: true 
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
  orderItemCode: { type: String, sparse: true },
  channelSkuCode: { type: String, required: true, index: true },
  qcPassAbsoluteQuantity: { type: Number, required: true, min: 0 },
  qcFailAbsoluteQuantity: { type: Number, required: true, min: 0 },
  qcFailDeltaQuantity: { type: Number, required: true },
  qcPassDeltaQuantity: { type: Number, required: true },
  orderItemCustomAttributes: { 
    type: orderItemCustomAttributesSchema, 
    default: null 
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
  channelMeta: channelMetadataSchema,
  currency: { type: String, default: 'INR', uppercase: true }
}, { _id: false, strict: false });

const orderSchema = new Schema({
  orderCode: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true 
  },
  partnerCode: { 
    type: String, 
    required: true, 
    index: true,
    trim: true 
  },
  partnerLocationCode: { 
    type: String, 
    required: true,
    trim: true 
  },
  locationCode: { 
    type: String, 
    required: true, 
    index: true,
    trim: true 
  },
  messageId: { 
    type: Number, 
    required: true,
    index: true 
  },
  parentOrderCode: { 
    type: String, 
    index: true,
    trim: true 
  },
  asnCode: { 
    type: String,
    trim: true 
  },
  generatedAsnId: { 
    type: String,
    trim: true 
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  orderCustomAttributes: orderCustomAttributesSchema
}, {
  timestamps: true,
  collection: 'orders'
});

// Compound indexes
orderSchema.index({ partnerCode: 1, locationCode: 1 });
orderSchema.index({ orderCode: 1, partnerCode: 1 });
orderSchema.index({ 'orderCustomAttributes.channelMetadata.status': 1, createdAt: -1 });
orderSchema.index({ messageId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
