const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  line3: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }
}, { _id: false });

const invoiceItemSchema = new mongoose.Schema({
  actualSellingPricePerUnit: { type: Number },
  actualSellingPriceTotal: { type: Number },
  channelSkuCode: { type: String },
  itemName: { type: String },
  quantity: { type: Number },
  taxRule: { type: String },
  hsnCode: { type: String },
  vendorSku: { type: String },
  mrp: { type: Number },
  brand: { type: String },
  styleCode: { type: String },
  color: { type: String },
  size: { type: String },
  category: { type: String },
  imageUrl: { type: String }
}, { _id: false });

const packboxDetailsSchema = new mongoose.Schema({
  boxId: { type: Number },
  boxCode: { type: String },
  length: { type: Number },
  breadth: { type: Number },
  height: { type: Number },
  weight: { type: Number },
  volWeight: { type: Number },
  boxSkuId: { type: String }
}, { _id: false });

const shipmentItemSchema = new mongoose.Schema({
  channelSkuCode: { type: String, required: true },
  orderItemCode: { type: String, required: true },
  quantity: { type: Number, required: true },
  itemCodes: [{ type: String }],
  externalSerialCodes: [{ type: String }],
  skuDimension: {
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number },
    weight: { type: Number }
  },
  orderItemCustomAttributes: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const packOrderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, index: true },
  locationCode: { type: String, required: true },
  shipmentId: { type: Number, required: true },
  packageSku: { type: String },
  weight: { type: Number },
  fulfillmentType: { type: String },
  dimensions: {
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number }
  },
  invoice: {
    fromAddress: { type: addressSchema },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    orderTime: { type: Date },
    channelName: { type: String },
    fromPartyName: { type: String },
    toPartyName: { type: String },
    fromTIN: { type: String },
    toTIN: { type: String },
    panNo: { type: String },
    invoiceItems: [invoiceItemSchema]
  },
  packboxDetailsList: [packboxDetailsSchema],
  shipmentItems: [shipmentItemSchema],
  orderCustomAttributes: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Idempotency lookup
packOrderSchema.index({ orderCode: 1, shipmentId: 1 }, { unique: true });

module.exports = mongoose.model('PackOrder', packOrderSchema);
