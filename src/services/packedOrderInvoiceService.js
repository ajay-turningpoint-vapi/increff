const PackedOrderInvoice = require('../models/PackedOrderInvoice');
const BusyInvoice = require('../models/PackedOrderInvoiceURL');

class PackedOrderInvoiceService {
  async createPackedOrderInvoice(payload) {
    const { invoiceCode } = payload;
    
    // Remove any legacy indexes in the database that are no longer defined in the schema
    try {
      await PackedOrderInvoice.syncIndexes();
    } catch (err) {
      console.warn("Failed to sync indexes:", err);
    }

    // Upsert the invoice
    const invoice = await PackedOrderInvoice.findOneAndUpdate(
      { invoiceCode },
      payload,
      { new: true, upsert: true, runValidators: true }
    );
    
    return invoice;
  }

  async getPackedOrderInvoice(invoiceCode) {
    const busyInvoice = await BusyInvoice.findOne({ invoiceCode });
    if (!busyInvoice) return null;

    const invoice = await PackedOrderInvoice.findOne({ invoiceCode });
    if (!invoice) return null;

    invoice.invoiceUrl = busyInvoice.invoiceUrl;
    return invoice;
  }
}

module.exports = new PackedOrderInvoiceService();
