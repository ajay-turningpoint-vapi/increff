const PackOrder = require("../models/PackOrder");
const { emitSyncEventBusy } = require("../utils/emitSyncEventBusy");

class PackOrderService {
  /**
   * Processes the pack notification from Increff
   * @param {Object} payload Webhook payload
   */
  async processPackNotification(payload) {
    const { orderCode, shipmentId } = payload;

    // Handle $date formatting for Mongoose
    if (payload.invoice && payload.invoice.orderTime && payload.invoice.orderTime.$date) {
      payload.invoice.orderTime = new Date(payload.invoice.orderTime.$date);
    }

    // 1. Idempotency Check
    const existingOrder = await PackOrder.findOne({ orderCode, shipmentId });

    if (existingOrder) {
      // If already processed, return the formatted response for Increff success acknowledgment
      return this.formatIncreffResponse(payload, existingOrder);
    }

    // 2. Map and Save the full payload keeping it strictly separate
    const newPackOrder = new PackOrder(payload);
    await newPackOrder.save();
    
    // 3. Emit event to queue
    await emitSyncEventBusy("PACKORDER_CREATED", newPackOrder.toObject());

    return this.formatIncreffResponse(payload, newPackOrder);
  }

  /**
   * Formats the response exactly as expected by Increff OMS
   */
  formatIncreffResponse(payload, packOrder) {
    return {
      shipmentCode: String(packOrder.shipmentId),
      transporter: "ATSIN", // Defaulting to this as per current constraints
      shipmentItems: (payload.shipmentItems || []).map(item => ({
        channelSkuCode: item.channelSkuCode,
        orderItemCode: item.orderItemCode,
        quantity: item.quantity,
        itemMetaData: item.orderItemCustomAttributes || null // Mapping extra custom attributes if required by response schema
      })),
      invoiceMetaData: {},
      shippingLabelMetaData: {}
    };
  }

  /**
   * Retrieves all pack orders
   * @returns {Promise<Array>} List of all pack orders
   */
  async getAllPackOrders() {
    return await PackOrder.find({}).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a pack order by its order code
   * @param {string} orderCode
   * @returns {Promise<Object>} Pack order document
   */
  async getPackOrderByOrderCode(orderCode) {
    return await PackOrder.findOne({ orderCode });
  }
}

module.exports = new PackOrderService();
