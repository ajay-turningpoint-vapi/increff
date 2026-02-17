const mongoose = require("mongoose");

const inventoryJobSchema = new mongoose.Schema({
  totalRows: { type: Number, default: 0 },
  processedRows: { type: Number, default: 0 },
  successRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "COMPLETED_WITH_ERRORS"],
    default: "PENDING"
  }
}, { timestamps: true });

module.exports = mongoose.model("InventoryJob", inventoryJobSchema);
