const express = require("express");
const InventoryJob = require("../models/InventoryJob");
const InventoryFailure = require("../models/InventoryFailure");

const router = express.Router();

router.get("/:jobId", async (req, res) => {
  const job = await InventoryJob.findById(req.params.jobId);
  res.json(job);
});

router.get("/:jobId/failures", async (req, res) => {
  const failures = await InventoryFailure.find({
    jobId: req.params.jobId
  });
  res.json(failures);
});

module.exports = router;
