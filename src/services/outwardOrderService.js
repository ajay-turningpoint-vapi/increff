const mongoose = require("mongoose");
const moment = require("moment-timezone");
const OutwardOrder = require("../models/OutwardOrder");
const ApiError = require("../utils/ApiError");
const { buildOutwardSaleXml } = require("../utils/buildBusyXml");
const { emitSyncEventBusy } = require("../utils/emitSyncEventBusy");

const MAX_ITEMS = 2000; // Define your max items limit

class OutwardOrderService {
  async createOrder(payload) {
    const { orderItems } = payload;

    // 1. Validation
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new ApiError(400, "orderItems must be a non-empty array");
    }

    if (orderItems.length > MAX_ITEMS) {
      throw new ApiError(
        400,
        `orderItems cannot exceed ${MAX_ITEMS}. Received: ${orderItems.length}`,
      );
    }

    const codes = orderItems.map((i) => i.orderItemCode);
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      throw new ApiError(
        400,
        "orderItemCode must be unique per order. Duplicate orderItemCode found.",
      );
    }

    // 2. Idempotency Check (Highly recommended for ERP webhooks)
    const existingOrder = await OutwardOrder.findOne({
      messageId: payload.messageId,
    });
    if (existingOrder) {
      // If it's a duplicate webhook, return the existing order without creating a new one
      return await this.getOrder(existingOrder.orderCode);
    }

    // 3. Save directly (No need for transactions or separate item inserts)
    const orderDoc = new OutwardOrder(payload);
    await orderDoc.save();

    // 4. Emit event to queue for Busy sync
    await emitSyncEventBusy("OUTWARD_CREATED", { order: orderDoc });

    const order = await this.getOrder(orderDoc.orderCode);

    return order;
  }

  /**
   * Always returns order + items embedded naturally
   */
  async getOrder(orderCode) {
    // Because _id was set to false in the embedded schemas,
    // the items will already be clean of unwanted IDs.
    const order = await OutwardOrder.findOne({ orderCode })
      .select("-_id -__v -updatedAt")
      .lean();

    if (!order) {
      throw new ApiError(404, "Outward order not found");
    }

    return order;
  }

  /**
   * Paginated items for an order
   * Slices the embedded array in-memory for pagination
   */
  async getOrderItems(orderCode, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const order = await OutwardOrder.findOne({ orderCode })
      .select("orderItems")
      .lean();

    if (!order) {
      throw new ApiError(404, "Outward order not found");
    }

    const total = order.orderItems.length;
    const items = order.orderItems.slice(skip, skip + limit);

    return {
      orderCode,
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List orders — orderItems are automatically included
   */
  async listOrders(page = 1, limit = 50, filters = {}) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OutwardOrder.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-_id -__v -updatedAt") // Automatically includes orderItems array
        .lean(),
      OutwardOrder.countDocuments(filters),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get orders by date, dynamically omitting arrays if needed
   */
  async getOutwardOrderByDate(dateString, includeItems = true) {
    const startOfDay = moment
      .tz(dateString, "YYYY/MM/DD", "Asia/Kolkata")
      .startOf("day")
      .toDate();

    const endOfDay = moment
      .tz(dateString, "YYYY/MM/DD", "Asia/Kolkata")
      .endOf("day")
      .toDate();

    const dateFilter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    // If includeItems is false, project out the orderItems array to save bandwidth
    const projection = includeItems
      ? "-_id -__v -updatedAt"
      : "-_id -__v -updatedAt -orderItems";

    const orders = await OutwardOrder.find(dateFilter)
      .select(projection)
      .lean();

    if (!orders.length) {
      throw new ApiError(404, "No orders found for the given date");
    }

    // No need to manually merge arrays; MongoDB does it for you.
    return orders;
  }

  /**
   * Send outward sales order to Busy as XML
   * Generates XML from order data and sends to Busy service
   */
  async sendOutwardSalesToBusy(orderCode) {
    try {
      // Fetch the order with all details
      const order = await this.getOrder(orderCode);

      if (!order) {
        throw new ApiError(404, `Order ${orderCode} not found`);
      }

      // Generate XML from order data
      const saleXML = buildOutwardSaleXml(order);

      // Here you would send the XML to Busy service
      // Example: await busyService.sendSale(saleXML);
      // For now, returning the XML for testing

      return {
        success: true,
        orderCode,
        xml: saleXML,
        message: "Sale XML generated successfully",
      };
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        `Failed to send sales to Busy: ${error.message}`,
      );
    }
  }
}

module.exports = new OutwardOrderService();
