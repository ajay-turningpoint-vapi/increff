const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

class InvoiceService {
  async createInvoice(invoiceData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { items, ...invoiceFields } = invoiceData;
      const invoiceDoc = new Invoice({
        ...invoiceFields,
        itemCount: items.length
      });
      await invoiceDoc.save({ session });

      const itemsToInsert = items.map(item => ({
        ...item,
        invoiceId: invoiceDoc.invoiceId,
        orderCode: invoiceDoc.orderCode
      }));

      await InvoiceItem.insertMany(itemsToInsert, { session });

      await session.commitTransaction();
      session.endSession();

      return invoiceDoc;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getInvoice(invoiceId, includeItems = true) {
    const invoice = await Invoice.findOne({ invoiceId }).lean();
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }
    if (includeItems) {
      const items = await InvoiceItem.find({ invoiceId }).lean();
      invoice.items = items;
    }
    return invoice;
  }

async getAllInvoices(page = 1, limit = 50, includeItems = false) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments({})
    ]);

    if (includeItems && invoices.length > 0) {
      const invoiceIds = invoices.map(inv => inv.invoiceId);
      const items = await InvoiceItem.find({ invoiceId: { $in: invoiceIds } }).lean();

const itemsByInvoice = items.reduce((acc, item) => {
        if (!acc[item.invoiceId]) acc[item.invoiceId] = [];
        acc[item.invoiceId].push(item);
        return acc;
      }, {});

      invoices.forEach(inv => {
        inv.items = itemsByInvoice[inv.invoiceId] || [];
      });
    }

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new InvoiceService();
