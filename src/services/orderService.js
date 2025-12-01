const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const ApiError = require('../utils/ApiError');
const moment = require('moment-timezone');  
class OrderService {
  // async createOrder(orderPayload) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const {
  //       orderItems,
  //       gateEntryLevelBoxSkuDetails,
  //       ...orderFields
  //     } = orderPayload;

  //     if (!Array.isArray(orderItems) || orderItems.length === 0) {
  //       throw new ApiError(400, 'orderItems must be a non-empty array');
  //     }

  //     const orderDoc = new Order({
  //       ...orderFields,
  //       itemCount: orderItems.length,
  //       gateEntryLevelBoxSkuDetails: gateEntryLevelBoxSkuDetails || undefined
  //     });

  //     await orderDoc.save({ session });

  //     const itemDocs = orderItems.map(item => ({
  //       ...item,
  //       orderCode: orderDoc.orderCode
  //     }));

  //     await OrderItem.insertMany(itemDocs, { session });

  //     await session.commitTransaction();
  //     session.endSession();

  //     return orderDoc;
  //   } catch (err) {
  //     await session.abortTransaction();
  //     session.endSession();
  //     throw err;
  //   }
  // }


async createOrder(orderPayload) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for duplicate messageId
    const duplicate = await Order.findOne({ messageId: orderPayload.messageId }).session(session);
    if (duplicate) {
      throw new ApiError(400, `Order with messageId ${orderPayload.messageId} already exists`);
    }

    const {
      orderItems,
      gateEntryLevelBoxSkuDetails,
      ...orderFields
    } = orderPayload;

    const orderDoc = new Order({
      ...orderFields,
      itemCount: orderItems.length,
      gateEntryLevelBoxSkuDetails: gateEntryLevelBoxSkuDetails || undefined
    });

    await orderDoc.save({ session });

    const itemDocs = orderItems.map(item => ({
      ...item,
      orderCode: orderDoc.orderCode
    }));

    await OrderItem.insertMany(itemDocs, { session });

    await session.commitTransaction();
    session.endSession();

    return orderDoc;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Handle duplicate key error (just in case)
    if (err.code === 11000 && err.keyValue?.messageId) {
      throw new ApiError(400, `Order with messageId ${err.keyValue.messageId} already exists`);
    }

    throw err;
  }
}


  async getOrder(orderCode, includeItems = true) {
    const order = await Order.findOne({ orderCode }).select('-_id -itemCount -__v').lean();
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (includeItems) {
      const items = await OrderItem.find({ orderCode }).select('-_id -__v  -createdAt -updatedAt') .lean();
      order.orderItems = items;
    }

    return order;
  }


 async getAllOrders({ startDate, endDate } = {}, page = 1, limit = 50, includeItems = false) {
    const skip = (page - 1) * limit;
    const query = {};

    if (startDate || endDate) {
      const filterDate = {};
      if (startDate) {
        filterDate.$gte = moment.tz(startDate, 'YYYY/MM/DD', 'Asia/Kolkata').startOf('day').toDate();
      }
      if (endDate) {
        filterDate.$lte = moment.tz(endDate, 'YYYY/MM/DD', 'Asia/Kolkata').endOf('day').toDate();
      }
      query.createdAt = filterDate;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-_id -itemCount -__v')
        .lean(),
      Order.countDocuments(query)
    ]);

    if (includeItems && orders.length > 0) {
      const orderCodes = orders.map(o => o.orderCode);
      
      const items = await OrderItem.find({ orderCode: { $in: orderCodes } })
        .select('-_id -__v  -createdAt -updatedAt') // optionally exclude _id, __v, orderCode from items if you want
        .lean();

console.log("orderCodes",items);
      

      // Group items by orderCode
      const itemsGrouped = items.reduce((acc, item) => {
        if (!acc[item.orderCode]) acc[item.orderCode] = [];
        acc[item.orderCode].push(item);
        return acc;
      }, {});
       orders.forEach(order => {
        order.orderItems = itemsGrouped[order.orderCode] || [];
      });
    }

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderItems(orderCode, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      OrderItem.find({ orderCode })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderItem.countDocuments({ orderCode })
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
}

module.exports = new OrderService();
