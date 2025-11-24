const mongoose = require('mongoose');
const { Schema } = mongoose;

const channelMetadataSchema = new Schema({
  totalCashOnDeliveryFee: { type: Number, default: 0 },
  department: { type: String, trim: true },
  paymentMethod: { type: String, trim: true },
  status: { 
    type: String, 
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
  channelMeta: channelMetadataSchema
}, { _id: false, strict: false });

const orderItemSchema = new Schema({
  orderCode: {
    type: String,
    required: [true, 'Order code is required'],
    index: true,
    trim: true
  },
  orderItemCode: { 
    type: String, 
    sparse: true,
    index: true,
    trim: true
  },
  channelSkuCode: { 
    type: String, 
    required: [true, 'Channel SKU code is required'],
    index: true,
    trim: true
  },
  qcPassAbsoluteQuantity: { 
    type: Number, 
    required: [true, 'QC pass quantity is required'],
    min: [0, 'QC pass quantity cannot be negative']
  },
  qcFailAbsoluteQuantity: { 
    type: Number, 
    required: [true, 'QC fail quantity is required'],
    min: [0, 'QC fail quantity cannot be negative']
  },
  qcFailDeltaQuantity: { 
    type: Number, 
    required: [true, 'QC fail delta is required']
  },
  qcPassDeltaQuantity: { 
    type: Number, 
    required: [true, 'QC pass delta is required']
  },
  orderItemCustomAttributes: { 
    type: orderItemCustomAttributesSchema, 
    default: null 
  }
}, {
  timestamps: true,
  collection: 'order_items'
});

// Compound indexes for efficient queries
orderItemSchema.index({ orderCode: 1, channelSkuCode: 1 });
orderItemSchema.index({ orderCode: 1, createdAt: -1 });
orderItemSchema.index({ channelSkuCode: 1, orderCode: 1 });
orderItemSchema.index({ orderCode: 1, orderItemCode: 1 }, { sparse: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
