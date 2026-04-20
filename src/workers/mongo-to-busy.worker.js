const { Worker } = require("bullmq");
const connection = require("../config/redis");
const {
  sendVoucherToBusy,
  sendInwardOrderToBusy,
  sendOutwardOrderToBusy,
  sendPackOrderToBusy
} = require("../services/busy.service");


const worker = new Worker(
  "mongo-to-busy",
  async (job) => {
    console.log("🟡 Job picked:", job.id, job.name);

    if (job.data.event === "ORDER_CREATED") {
      await sendVoucherToBusy(job.data.payload);
    }

    if (job.data.event === "INWARD_CREATED") {
      await sendInwardOrderToBusy(job.data.payload);
    }

    if (job.data.event === "OUTWARD_CREATED") {
      await sendOutwardOrderToBusy(
        job.data.payload,
      );
    }

    if (job.data.event === "PACKORDER_CREATED") {
      await sendPackOrderToBusy(job.data.payload);
    }

    console.log("🟢 Job done:", job.id);
  },
  { connection, concurrency: 5 },
);

worker.on("completed", (job) => {
  console.log(`✅ Completed Job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Failed Job ${job?.id}`, err);
});

worker.on("error", (err) => {
  console.error("🔥 Worker Error:", err);
});

console.log("🚀 Worker started: mongo-to-busy");

module.exports = worker;
