const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
  name: { type: String, required: true },
  line1: { type: String, required: true },
  line2: String,
  line3: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  email: String,
  phone: String
}, { _id: false });

const TaxItemSchema = new Schema({
  type: { type: String, required: true },
  rate: { type: Number, required: true },
  taxPerUnit: { type: Number, required: true },
  taxTotal: { type: Number, required: true }
}, { _id: false });

const ShipmentItemSchema = new Schema({
  channelSkuCode: { type: String, required: true },
  locationCode: { type: String, required: true },
  orderItemCode: { type: String, required: true },
  netTaxAmountPerUnit: { type: Number, required: true },
  netTaxAmountTotal: { type: Number, required: true },
  baseSellingPricePerUnit: { type: Number, required: true },
  baseSellingPriceTotal: { type: Number, required: true },
  sellingPricePerUnit: { type: Number, required: true },
  sellingPriceTotal: { type: Number, required: true },
  quantity: { type: Number, required: true },
  shippingChargePerUnit: Number,
  channelDiscount: Number,
  barcode: String,
  clientSkuCode: String,
  taxItems: [TaxItemSchema]
}, { _id: false });

const ShipmentSchema = new Schema({
  shipmentCode: { type: String, required: true },
  omsShipmentId: String,
  locationCode: String,
  generatedInvoiceId: String,
  generatedInvoiceDate: Date,
  externalInvoiceId: String,
  externalInvoiceDate: Date,
  invoiceDocumentUrl: String,
  shippingLabelDocumentUrl: String,
  irn: String,
  qrCode: String,
  shipmentStatus: { type: String, required: true },
  awbNumber: String,
  transporter: String,
  packageSku: String,
  deliveredAt: Date,
  packedAt: Date,
  shipmentItems: [ShipmentItemSchema],
  shipmentDetails: Schema.Types.Mixed // Using Mixed for flexibility on the deep packbox nesting
}, { _id: false });

const OrderItemSchema = new Schema({
  orderItemCode: { type: String, required: true },
  channelSkuCode: { type: String, required: true },
  orderedQuantity: { type: Number, required: true },
  cancelledQuantity: { type: Number, required: true },
  customerCancelledQty: Number,
  sellerCancelledQty: Number,
  sellerRejectQty: Number,
  channelDiscount: Number,
  sellingPricePerUnit: { type: Number, required: true },
  giftChargePerUnit: Number,
  sellerDiscount: Number,
  shippingCharge: Number,
  omsItemId: Number,
  barcode: { type: String, required: true },
  clientSkuCode: String,
  orderItemCustomAttributes: Schema.Types.Mixed
}, { _id: false });

const OutwardOrderSchema = new Schema({
  partnerCode: { type: String, required: true },
  partnerLocationCode: { type: String, required: true },
  locationCode: { type: String, required: true },
  orderCode: { type: String, required: true },
  parentOrderCode: String,
  isPriority: { type: Boolean, required: true },
  channelName: { type: String, required: true },
  orderTime: { type: Date, required: true },
  orderType: { type: String, required: true },
  messageId: { type: Number, required: true, unique: true }, // Unique index for Idempotency
  paymentMethod: { type: String, required: true },
  eventType: { type: String, required: true },
  eventTime: { type: Date, required: true },
  omsOrderId: Number,
  turnAroundTime: Date,
  virtualSkuDefinitions: [Schema.Types.Mixed],
  bundledSkuDefinitions: [Schema.Types.Mixed],
  isSplitRequired: { type: Boolean, required: true },
  shippingCharges: Number,
  channelType: String,
  orderItems: [OrderItemSchema],
  shipments: [ShipmentSchema],
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  orderCustomAttributes: Schema.Types.Mixed
}, { timestamps: true });

// Compound index to help query by order and shipment quickly if needed for future updates
OutwardOrderSchema.index({ orderCode: 1, 'shipments.shipmentCode': 1 });

module.exports = mongoose.model('OutwardOrder', OutwardOrderSchema);