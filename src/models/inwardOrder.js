const mongoose = require('mongoose');

const TaxItemFormSchema = new mongoose.Schema({
    type: { type: String, required: true },
    rate: { type: Number, required: true },
    taxPerUnit: { type: Number, required: true }
}, { _id: false });

const TaxBreakupFormSchema = new mongoose.Schema({
    channelSkuId: { type: String, required: true },
    baseSellingPricePerUnit: { type: Number, required: true },
    taxItemForms: { type: [TaxItemFormSchema], required: true }
}, { _id: false });

const CustomAttributesSchema = new mongoose.Schema({
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
    channelMetadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    currency: String
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
    channelSkuCode: { type: String, required: true },
    quantity: { type: Number, required: true },
    sellingPricePerUnit: { type: Number, required: true },
    orderItemCode: { type: String, required: true },
    orderItemCustomAttributes: CustomAttributesSchema
}, { _id: false });

const InwardOrderSchema = new mongoose.Schema({
    isAsnExpected: { type: Boolean, default: false },
    isSampleQcAllowed: { type: Boolean, default: false },
    minInspectPercent: { type: Number },
    minPassPercent: { type: Number },
    parentOrderCode: { type: String },
    orderTime: { type: Date, required: true },
    orderType: { 
        type: String, 
        required: true,
        enum: ['PO', 'STO', 'RO', 'OPEN_PO', 'OPEN_RO']
    },
    orderCode: { type: String, required: true, unique: true },
    locationCode: { type: String, required: true },
    partnerCode: { type: String, required: true },
    partnerLocationCode: { type: String, required: true },
    handlingType: { 
        type: String, 
        enum: ['CROSS_DOCK', 'STORAGE'], 
        default: 'STORAGE' 
    },
    strategyName: { type: String },
    taxBreakupForms: [TaxBreakupFormSchema],
    orderItems: {
        type: [OrderItemSchema],
        validate: {
            validator: function(items) {
                if (['OPEN_PO', 'OPEN_RO'].includes(this.orderType)) {
                    return true; // Not mandatory for OPEN_PO/OPEN_RO
                }
                return items && items.length > 0;
            },
            message: 'orderItems are mandatory unless orderType is OPEN_PO or OPEN_RO'
        }
    },
    orderCustomAttributes: CustomAttributesSchema
}, { timestamps: true });

module.exports = mongoose.model('InwardOrder', InwardOrderSchema);