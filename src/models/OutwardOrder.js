const mongoose = require('mongoose');
const { Schema } = mongoose;

// ---------- Sub-schemas ----------

// Tax breakup
const taxItemFormSchema = new Schema({
  type: { type: String, required: true },          // e.g. VAT, GST
  rate: { type: Number, required: true },          // tax %
  taxPerUnit: { type: Number, required: true }     // per unit tax
}, { _id: false });

const taxBreakupFormSchema = new Schema({
  channelSkuId: { type: String, required: true },
  baseSellingPricePerUnit: { type: Number, required: true },
  taxItemForms: {
    type: [taxItemFormSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message: 'taxItemForms must be a non-empty array'
    }
  }
}, { _id: false });

// Channel metadata embedded in orderCustomAttributes
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

// ---------- Main outward order schema ----------

const outwardOrderSchema = new Schema({
  parentOrderCode: { type: String, trim: true },
  locationCode: { type: String, trim: true },          // optional if split is done by OMS
  inventoryPool: { type: String, trim: true },
  orderCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  orderTime: { type: Date, required: true },
  orderType: {
    type: String,
    required: true,
    enum: ['SO', 'STO', 'RTV', 'CRD']                  // as per spec
  },
  partnerCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  partnerLocationCode: {
    type: String,
    required: true,
    trim: true
  },
  onHold: { type: Boolean, required: true, default: false },
  dispatchByTime: { type: Date, required: true },
  startProcessingTime: { type: Date, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'NCOD']
  },
  isSplitRequired: { type: Boolean, required: true, default: false },

  taxBreakupForms: {
    type: [taxBreakupFormSchema],
    default: []
  },

  packType: {
    type: String,
    enum: ['PIECE', 'BULK'],
    default: 'PIECE'
  },

  qcStatus: {
    type: String,
    enum: ['PASS', 'FAIL'],
    default: 'PASS',
    required: true
  },

  orderCustomAttributes: {
    type: orderCustomAttributesSchema,
    default: null
  },

  itemCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'outward_orders'
});

// Helpful indexes
outwardOrderSchema.index({ partnerCode: 1, orderTime: -1 });
outwardOrderSchema.index({ locationCode: 1, orderTime: -1 });

module.exports = mongoose.model('OutwardOrder', outwardOrderSchema);
