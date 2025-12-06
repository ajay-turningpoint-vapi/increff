const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const moment = require("moment-timezone");

const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

class OrderService {
  /**
   * Create order with items using transaction
   */
  // async createOrder(orderData) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const { items, ...orderFields } = orderData;

  //      const existing = await Order.findOne({ messageId: orderFields.messageId }).session(session);
  //   if (existing) {
  //     throw new Error("Order with this messageId already exists");
  //   }

  //     // Create main order
  //     const order = new Order({
  //       ...orderFields,
  //       itemCount: items.length,
  //     });
  //     await order.save({ session });

  //     // Create order items in bulk
  //     const orderItems = items.map((item) => ({
  //       ...item,
  //       orderCode: order.orderCode,
  //     }));

  //     await OrderItem.insertMany(orderItems, { session });

  //     await session.commitTransaction();
  //     session.endSession();

  //     return order;
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();
  //     throw error;
  //   }
  // }

  async createOrder(orderData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, ...orderFields } = orderData;

    // Check if order with same messageId already exists
    const existing = await Order.findOne({ messageId: orderFields.messageId }).session(session);
    if (existing) {
      throw new Error("Order with this messageId already exists");
    }

    const order = new Order({
      ...orderFields,
      itemCount: items.length,
    });

    await order.save({ session });

    const orderItems = items.map((item) => ({
      ...item,
      orderCode: order.orderCode,
    }));

    await OrderItem.insertMany(orderItems, { session });

    await session.commitTransaction();
    return order;

  } catch (error) {

    await session.abortTransaction();

    // Duplicate index conflict
    if (error.code === 11000) {
      throw new Error("Duplicate messageId: Order already exists");
    }

    throw error;

  } finally {
    session.endSession();
  }
}


  /**
   * Bulk create orders with items
   */
  async bulkCreateOrders(ordersArray) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderDocs = [];
      const itemDocs = [];

      for (const orderData of ordersArray) {
        const { items, ...orderFields } = orderData;

        orderDocs.push({
          ...orderFields,
          itemCount: items.length,
        });

        items.forEach((item) => {
          itemDocs.push({
            ...item,
            orderCode: orderData.orderCode,
          });
        });
      }

      const orders = await Order.insertMany(orderDocs, { session });
      await OrderItem.insertMany(itemDocs, { session });

      await session.commitTransaction();
      session.endSession();

      return orders;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get order by code with optional items
   */
  async getOrderByCode(orderCode, includeItems = true) {
console.log("orderCode",orderCode);


    const order = await Order.findOne({ orderCode })
      .select("-_id -itemCount -__v")
      .lean();
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (includeItems) {
      const items = await OrderItem.find({ orderCode })
        .select("-_id -__v -createdAt -updatedAt")
        .lean();
      order.items = items;
    }

    return order;
  }

    /**
   * Get order by date with optional items
   */
  async getOrderByDate(dateString, includeItems = true) {
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
    const orders = await Order.find(dateFilter)
      .select("-_id -itemCount -__v")
      .lean();

    if (!orders.length) {
      throw new ApiError(404, "No orders found for the given date");
    }

    if (includeItems) {
      // Fetch items created on that date
      const items = await OrderItem.find(dateFilter)
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

  /**
   * Get order items with pagination
   */
  async getOrderItems(orderCode, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    // Verify order exists
    const orderExists = await Order.exists({ orderCode });
    if (!orderExists) {
      throw new ApiError(404, "Order not found");
    }

    const [items, total] = await Promise.all([
      OrderItem.find({ orderCode })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .select("-_id -__v -createdAt -updatedAt")
        .lean(),
      OrderItem.countDocuments({ orderCode }),
    ]);

    return {
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
   * Get all orders with pagination and filters
   */
  async getAllOrders(page = 1, limit = 50, filters = {}, includeItems = false) {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.partnerCode) query.partnerCode = filters.partnerCode;
    if (filters.locationCode) query.locationCode = filters.locationCode;
    if (filters.status) {
      query["orderCustomAttributes.channelMetadata.status"] = filters.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-_id -itemCount -__v")
        .lean(),
      Order.countDocuments(query),
    ]);

    // Optionally fetch items for each order
    if (includeItems && orders.length > 0) {
      const orderCodes = orders.map((o) => o.orderCode);
      const items = await OrderItem.find({
        orderCode: { $in: orderCodes },
      })
        .select("-_id -__v -createdAt -updatedAt")
        .lean();

      // Group items by orderCode
      const itemsByOrder = items.reduce((acc, item) => {
        if (!acc[item.orderCode]) acc[item.orderCode] = [];
        acc[item.orderCode].push(item);
        return acc;
      }, {});

      // Attach items to orders
      orders.forEach((order) => {
        order.items = itemsByOrder[order.orderCode] || [];
      });
    }

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
   * Get orders by partner
   */
  async getOrdersByPartner(partnerCode, page = 1, limit = 50) {
    return this.getAllOrders(page, limit, { partnerCode });
  }

  /**
   * Get orders by SKU
   */
  async getOrdersBySku(channelSkuCode, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OrderItem.find({ channelSkuCode })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean(),
      OrderItem.countDocuments({ channelSkuCode }),
    ]);

    // Get unique order codes
    const orderCodes = [...new Set(items.map((item) => item.orderCode))];

    // Fetch order details
    const orders = await Order.find({
      orderCode: { $in: orderCodes },
    })
      .select("-__v")
      .lean();

    // Map orders to items
    const orderMap = orders.reduce((acc, order) => {
      acc[order.orderCode] = order;
      return acc;
    }, {});

    const result = items.map((item) => ({
      ...item,
      orderDetails: orderMap[item.orderCode],
    }));

    return {
      items: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update single order item
   */
  async updateOrderItem(orderCode, orderItemCode, updateData) {
    const item = await OrderItem.findOneAndUpdate(
      { orderCode, orderItemCode },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new ApiError(404, "Order item not found");
    }

    return item;
  }

  /**
   * Update order (without items)
   */
  async updateOrder(orderCode, updateData) {
    // Remove items if accidentally passed
    delete updateData.items;
    delete updateData.itemCount;

    const order = await Order.findOneAndUpdate(
      { orderCode },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderCode, status) {
    return this.updateOrder(orderCode, {
      "orderCustomAttributes.channelMetadata.status": status,
    });
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(orderCodes, newStatus) {
    const result = await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      {
        $set: {
          "orderCustomAttributes.channelMetadata.status": newStatus,
          updatedAt: new Date(),
        },
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Delete order with items using transaction
   */
  async deleteOrder(orderCode) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOneAndDelete({ orderCode }, { session });
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Delete all associated items
      const deleteResult = await OrderItem.deleteMany(
        { orderCode },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        order,
        deletedItemsCount: deleteResult.deletedCount,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(partnerCode) {
    const matchStage = partnerCode ? { partnerCode } : {};

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$orderCustomAttributes.channelMetadata.status",
          count: { $sum: 1 },
          totalItems: { $sum: "$itemCount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get item-level stats
    const itemStatsQuery = partnerCode
      ? [
          {
            $lookup: {
              from: "orders",
              localField: "orderCode",
              foreignField: "orderCode",
              as: "order",
            },
          },
          { $unwind: "$order" },
          { $match: { "order.partnerCode": partnerCode } },
        ]
      : [];

    const itemStats = await OrderItem.aggregate([
      ...itemStatsQuery,
      {
        $group: {
          _id: null,
          totalQcPass: { $sum: "$qcPassAbsoluteQuantity" },
          totalQcFail: { $sum: "$qcFailAbsoluteQuantity" },
          totalItems: { $sum: 1 },
        },
      },
    ]);

    return {
      orderStats: stats,
      itemStats: itemStats[0] || {
        totalQcPass: 0,
        totalQcFail: 0,
        totalItems: 0,
      },
    };
  }

  /**
   * Add item to existing order
   */
  async addItemToOrder(orderCode, itemData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify order exists
      const order = await Order.findOne({ orderCode }).session(session);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Create new item
      const newItem = new OrderItem({
        ...itemData,
        orderCode,
      });
      await newItem.save({ session });

      // Update item count
      await Order.updateOne(
        { orderCode },
        { $inc: { itemCount: 1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return newItem;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Delete item from order
   */
  async deleteOrderItem(orderCode, orderItemCode) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const item = await OrderItem.findOneAndDelete(
        { orderCode, orderItemCode },
        { session }
      );

      if (!item) {
        throw new ApiError(404, "Order item not found");
      }

      // Update item count
      await Order.updateOne(
        { orderCode },
        { $inc: { itemCount: -1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return item;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new OrderService();
