const { Queue } = require("bullmq");
const redis = require("../config/redis");

module.exports = new Queue("inventoryQueue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 }
  }
});
