

const Excel = require("exceljs");
const InventoryBatch = require("../models/InventoryBatch");
const inventoryQueue = require("../Queue/inventory.queue");

const BATCH_SIZE = 200;

const log = {
  info: (msg, meta = {}) =>
    console.log(JSON.stringify({ level: "INFO", msg, ...meta })),
  warn: (msg, meta = {}) =>
    console.warn(JSON.stringify({ level: "WARN", msg, ...meta })),
  error: (msg, meta = {}) =>
    console.error(JSON.stringify({ level: "ERROR", msg, ...meta })),
};

function normalizeHeader(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function readCell(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  return String(cell.text || cell.value).trim();
}

async function processExcel(filePath, jobId) {
  const startTime = Date.now();

  log.info("Excel processing started", { jobId, filePath });

  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Excel file has no sheets");
  }

  log.info("Worksheet loaded", {
    jobId,
    sheetName: worksheet.name,
    totalRows: worksheet.rowCount,
  });

  let colMap = {};
  let batch = [];
  let batchNo = 1;
  let totalRows = 0;
  let invalidRows = 0;

  /* -------- HEADER DETECTION -------- */

  worksheet.getRow(1).eachCell((cell, col) => {
    const key = normalizeHeader(readCell(cell));
    if (key) colMap[key] = col;
  });

  const skuCol = colMap["channelskucode"];
  const locCol = colMap["locationcode"];
  const qtyCol = colMap["quantity"];

  if (!skuCol || !locCol || !qtyCol) {
    throw new Error(
      "Invalid Excel format. Required headers: channelSkuCode, locationCode, quantity"
    );
  }

  log.info("Detected column mapping", {
    jobId,
    skuCol,
    locCol,
    qtyCol,
  });

  /* -------- DATA ROWS -------- */

  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);

    const channelSkuCode = readCell(row.getCell(skuCol));
    const locationCode   = readCell(row.getCell(locCol));
    const quantity       = Number(readCell(row.getCell(qtyCol)));

    if (totalRows < 5) {
      log.info("Row sample", {
        jobId,
        row: r,
        channelSkuCode,
        locationCode,
        quantity,
      });
    }

    if (!channelSkuCode || !locationCode || isNaN(quantity)) {
      invalidRows++;
      log.warn("Invalid row detected", {
        jobId,
        row: r,
        channelSkuCode,
        locationCode,
        quantity,
      });
      continue;
    }

    totalRows++;

    batch.push({
      channelSkuCode,
      locationCode,
      quantity,
    });

    if (batch.length === BATCH_SIZE) {
      await createBatch(jobId, batchNo++, batch);
      batch = [];
    }
  }

  if (batch.length) {
    await createBatch(jobId, batchNo++, batch);
  }

  log.info("Excel processing completed", {
    jobId,
    totalRows,
    invalidRows,
    totalBatches: batchNo - 1,
    durationMs: Date.now() - startTime,
  });

  return totalRows;
}

async function createBatch(jobId, batchNo, inventories) {
  log.info("Creating batch", {
    jobId,
    batchNo,
    batchSize: inventories.length,
    sample: inventories.slice(0, 3),
  });

  const batch = await InventoryBatch.create({
    jobId,
    batchNo,
  });

  await inventoryQueue.add("updateInventory", {
    jobId,
    batchId: batch._id,
    inventories,
  });

  log.info("Batch pushed to queue", {
    jobId,
    batchNo,
    batchId: batch._id.toString(),
  });
}

module.exports = { processExcel };
