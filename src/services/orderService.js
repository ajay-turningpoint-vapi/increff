const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

class OrderService {
  // Create single order
  async createOrder(orderData) {
    const order = new Order(orderData);
    await order.save();
    return order;
  }

  // Bulk create orders
  async bulkCreateOrders(ordersArray) {
    return await Order.insertMany(ordersArray, { 
      ordered: false,
      lean: true 
    });
  }

  // Get order by orderCode
  async getOrderByCode(orderCode) {
    const order = await Order.findOne({ orderCode }).lean();
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    return order;
  }

  // Get all orders with pagination
  async getAllOrders(page = 1, limit = 50, filters = {}) {
    const skip = (page - 1) * limit;
    
    const query = {};
    if (filters.partnerCode) query.partnerCode = filters.partnerCode;
    if (filters.locationCode) query.locationCode = filters.locationCode;
    if (filters.status) {
      query['orderCustomAttributes.channelMetadata.status'] = filters.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

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

  // Get orders by partner
  async getOrdersByPartner(partnerCode, page = 1, limit = 50) {
    return this.getAllOrders(page, limit, { partnerCode });
  }

  // Get orders by SKU
  async getOrdersBySku(channelSkuCode) {
    return await Order.find({ 
      'items.channelSkuCode': channelSkuCode 
    })
    .select('orderCode partnerCode items createdAt')
    .lean();
  }

  // Update order
  async updateOrder(orderCode, updateData) {
    const order = await Order.findOneAndUpdate(
      { orderCode },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(orderCode, status) {
    return this.updateOrder(orderCode, {
      'orderCustomAttributes.channelMetadata.status': status
    });
  }

  // Bulk update status
  async bulkUpdateStatus(orderCodes, newStatus) {
    const result = await Order.updateMany(
      { orderCode: { $in: orderCodes } },
      { 
        $set: { 
          'orderCustomAttributes.channelMetadata.status': newStatus,
          updatedAt: new Date()
        } 
      }
    );

    return result;
  }

  // Delete order
  async deleteOrder(orderCode) {
    const order = await Order.findOneAndDelete({ orderCode });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    return order;
  }

  // Get order statistics
  async getOrderStats(partnerCode) {
    const stats = await Order.aggregate([
      ...(partnerCode ? [{ $match: { partnerCode } }] : []),
      {
        $group: {
          _id: '$orderCustomAttributes.channelMetadata.status',
          count: { $sum: 1 },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);

    return stats;
  }
}

module.exports = new OrderService();
