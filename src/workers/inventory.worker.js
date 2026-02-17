
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
require("dotenv").config();

const redis = require("../config/redis");
const { pushInventory } = require("../services/oms.service");

const InventoryJob = require("../models/InventoryJob");
const InventoryBatch = require("../models/InventoryBatch");

/* -------------------- Mongo Connection -------------------- */

mongoose.connect(process.env.MONGODB_URI_NEW_MODAL);

mongoose.connection.on("connected", () => {
  console.log("✅ Worker connected to MongoDB");
});

mongoose.connection.on("error", err => {
  console.error("❌ MongoDB connection error:", err);
});

/* -------------------- Worker -------------------- */

const worker = new Worker(
  "inventoryQueue",
  async job => {
    const { jobId, batchId, inventories } = job.data;

    console.log(`🟡 Processing batch ${batchId} | rows: ${inventories.length}`);

    await InventoryBatch.findByIdAndUpdate(batchId, {
      $inc: { attempts: 1 },
      status: "IN_PROGRESS",
    });

    try {
      /* ---------- Call OMS ---------- */
      const res = await pushInventory(inventories);

      const successCount = res.successCount;
      const failureCount = res.failureCount;

      /* ---------- Update batch ---------- */
      await InventoryBatch.findByIdAndUpdate(batchId, {
        status: "SUCCESS",
        processedRows: inventories.length,
        successRows: successCount,
        failedRows: failureCount,
      });

      /* ---------- Update job counters ---------- */
      await InventoryJob.findByIdAndUpdate(jobId, {
        $inc: {
          processedRows: inventories.length,
          successRows: successCount,
          failedRows: failureCount,
        },
      });

      /* ---------- Check if job completed ---------- */
      const jobDoc = await InventoryJob.findById(jobId);

      if (
        jobDoc.processedRows >= jobDoc.totalRows &&
        jobDoc.status === "IN_PROGRESS"
      ) {
        await InventoryJob.findByIdAndUpdate(jobId, {
          status:
            jobDoc.failedRows > 0
              ? "COMPLETED_WITH_ERRORS"
              : "COMPLETED",
          completedAt: new Date(),
        });

        console.log(`🏁 Inventory Job ${jobId} completed`);
      }

      console.log(
        `✅ Batch ${batchId} done | success=${successCount} failed=${failureCount}`
      );

      return true;
    } catch (err) {
      console.error(`❌ Batch ${batchId} failed`, err.message);

      // ❌ 401/403 are permanent → do not retry
      if ([401, 403].includes(err?.response?.status)) {
        await InventoryBatch.findByIdAndUpdate(batchId, {
          status: "FAILED",
          error: "AUTH_ERROR",
        });

        job.discard();
        return;
      }

      await InventoryBatch.findByIdAndUpdate(batchId, {
        status: "FAILED",
        error: err.message,
      });

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

/* -------------------- Worker Events -------------------- */

worker.on("completed", job => {
  console.log(`🟢 Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`🔴 Job failed: ${job?.id}`, err.message);
});

worker.on("error", err => {
  console.error("❌ Worker error:", err);
});

console.log("🚀 Inventory worker running...");
