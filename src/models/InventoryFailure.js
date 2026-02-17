const mongoose = require("mongoose");

const inventoryFailureSchema = new mongoose.Schema({
  jobId: mongoose.Schema.Types.ObjectId,
  batchId: mongoose.Schema.Types.ObjectId,
  channelSkuCode: String,
  locationCode: String,
  quantity: Number,
  errorMessage: String
}, { timestamps: true });

module.exports = mongoose.model("InventoryFailure", inventoryFailureSchema);
