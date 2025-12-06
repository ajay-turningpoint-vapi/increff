// src/services/outwardOrderService.js
const mongoose = require('mongoose');
const OutwardOrder = require('../models/OutwardOrder');
const OutwardOrderItem = require('../models/OutwardOrderItem');
const ApiError = require('../utils/ApiError');
const moment = require("moment-timezone");

const MAX_ITEMS = 2500;

class OutwardOrderService {
  async createOrder(payload) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderItems, ...orderFields } = payload;

      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new ApiError(400, 'orderItems must be a non-empty array');
      }

      if (orderItems.length > MAX_ITEMS) {
        throw new ApiError(
          400,
          `orderItems cannot exceed ${MAX_ITEMS}. Received: ${orderItems.length}`
        );
      }

      const codes = orderItems.map(i => i.orderItemCode);
      const uniqueCodes = new Set(codes);
      if (uniqueCodes.size !== codes.length) {
        throw new ApiError(
          400,
          'orderItemCode must be unique per order. Duplicate orderItemCode found.'
        );
      }

      const orderDoc = new OutwardOrder({
        ...orderFields,
        itemCount: orderItems.length
      });

      await orderDoc.save({ session });

      const itemDocs = orderItems.map(it => ({
        ...it,
        orderCode: orderDoc.orderCode
      }));

      await OutwardOrderItem.insertMany(itemDocs, { session });

      await session.commitTransaction();
      session.endSession();

      // Return full sanitized order WITH items (always)
      return await this.getOrder(orderDoc.orderCode);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Always returns order + items
   * Removes unwanted fields:
   *  Order => _id, itemCount, __v, updatedAt
   *  Item  => _id, __v, createdAt, updatedAt
   */
  async getOrder(orderCode) {
    const order = await OutwardOrder.findOne({ orderCode })
      .select('-_id -itemCount -__v -updatedAt')
      .lean();

    if (!order) {
      throw new ApiError(404, 'Outward order not found');
    }

    const items = await OutwardOrderItem.find({ orderCode })
      .select('-_id -__v -createdAt -updatedAt')
      .lean();

    order.orderItems = items;
    return order;
  }

  /**
   * Paginated items for an order — always sanitized
   */
  async getOrderItems(orderCode, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OutwardOrderItem.find({ orderCode })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .select('-_id -__v -createdAt -updatedAt')
        .lean(),

      OutwardOrderItem.countDocuments({ orderCode })
    ]);

    return {
      orderCode,
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * List orders — always sanitized
   */
  // async listOrders(page = 1, limit = 50, filters = {}) {
  //   const skip = (page - 1) * limit;

  //   const [orders, total] = await Promise.all([
  //     OutwardOrder.find(filters)
  //       .sort({ createdAt: -1 })
  //       .skip(skip)
  //       .limit(limit)
  //       .select('-_id -itemCount -__v -updatedAt')
  //       .lean(),

  //     OutwardOrder.countDocuments(filters)
  //   ]);

  //   return {
  //     orders,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       pages: Math.ceil(total / limit)
  //     }
  //   };
  // }

async listOrders(page = 1, limit = 50, filters = {}) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    OutwardOrder.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-_id -itemCount -__v -updatedAt')
      .lean(),
    OutwardOrder.countDocuments(filters)
  ]);

  if (!orders || orders.length === 0) {
    return {
      orders: [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  const orderCodes = orders.map(o => o.orderCode);

  // explicitly include orderCode
  const items = await OutwardOrderItem.find({ orderCode: { $in: orderCodes } })
    .select('orderCode channelSkuCode orderItemCode quantity sellerDiscountPerUnit channelDiscountPerUnit sellingPricePerUnit shippingChargePerUnit minExpiry giftOptions orderItemCustomAttributes')
    .lean();

  const itemsByOrder = items.reduce((acc, it) => {
    if (!acc[it.orderCode]) acc[it.orderCode] = [];
    acc[it.orderCode].push(it);
    return acc;
  }, {});

  const ordersWithItems = orders.map(o => ({
    ...o,
    orderItems: itemsByOrder[o.orderCode] || []
  }));

  return {
    orders: ordersWithItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}


async getOutwardOrderByDate(dateString, includeItems = true) {
    // Convert YYYY/MM/DD → IST start & end of day
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

    // Fetch all orders created on that date
    const orders = await OutwardOrder.find(dateFilter)
      .select("-_id -itemCount -__v -updatedAt")
      .lean();

    if (!orders.length) {
      throw new ApiError(404, "No orders found for the given date");
    }

    if (includeItems) {
      // Fetch items created on that date
      const items = await OutwardOrderItem.find(dateFilter)
        .select("-_id -__v -createdAt -updatedAt")
        .lean();

      // Attach items to their parent orderCode
      const itemsGrouped = items.reduce((acc, item) => {
        acc[item.orderCode] = acc[item.orderCode] || [];
        acc[item.orderCode].push(item);
        return acc;
      }, {});

      // Merge items into orders
      orders.forEach((order) => {
        order.items = itemsGrouped[order.orderCode] || [];
      });
    }

    return orders;
  }


}


module.exports = new OutwardOrderService();
