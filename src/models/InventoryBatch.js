const mongoose = require("mongoose");

const inventoryBatchSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryJob"
  },
  batchNo: Number,
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING"
  },
  attempts: { type: Number, default: 0 },
  error: String
}, { timestamps: true });

module.exports = mongoose.model("InventoryBatch", inventoryBatchSchema);
