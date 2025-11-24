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
    required: [true, 'Order code is required'],
    unique: true, 
    index: true,
    trim: true 
  },
  partnerCode: { 
    type: String, 
    required: [true, 'Partner code is required'],
    index: true,
    trim: true 
  },
  partnerLocationCode: { 
    type: String, 
    required: [true, 'Partner location code is required'],
    trim: true 
  },
  locationCode: { 
    type: String, 
    required: [true, 'Location code is required'],
    index: true,
    trim: true 
  },
  messageId: { 
    type: Number, 
    required: [true, 'Message ID is required'],
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
  itemCount: {
    type: Number,
    default: 0,
    min: 0
  },
  orderCustomAttributes: orderCustomAttributesSchema
}, {
  timestamps: true,
  collection: 'orders'
});

// Compound indexes for common query patterns
orderSchema.index({ partnerCode: 1, locationCode: 1 });
orderSchema.index({ orderCode: 1, partnerCode: 1 });
orderSchema.index({ 'orderCustomAttributes.channelMetadata.status': 1, createdAt: -1 });
orderSchema.index({ messageId: 1, createdAt: -1 });

// Virtual for items (optional - for populate)
orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: 'orderCode',
  foreignField: 'orderCode'
});

module.exports = mongoose.model('Order', orderSchema);
