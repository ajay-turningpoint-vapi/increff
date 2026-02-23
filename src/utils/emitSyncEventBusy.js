const mongoToBusyQueue = require("../Queue/mongo-to-busy.queue");

async function emitSyncEventBusy(event, payload) {
  await mongoToBusyQueue.add("sync-job-busy", {
    event,
    payload,
    timestamp: Date.now(),
  });
}

module.exports = { emitSyncEventBusy };
