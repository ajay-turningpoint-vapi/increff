
// const axios = require("axios");

// const OMS_URL =
//   "https://staging-common-assure.increff.com/assure-magic2/updateInventories";

// // simple structured logger
// const log = {
//   info: (msg, meta = {}) =>
//     console.log(JSON.stringify({ level: "INFO", msg, ...meta })),
//   error: (msg, meta = {}) =>
//     console.error(JSON.stringify({ level: "ERROR", msg, ...meta })),
// };

// async function pushInventory(inventories) {
//   const startTime = Date.now();

//   log.info("OMS inventory push started", {
//     url: OMS_URL,
//     inventoryCount: inventories.length,
//   });

//   try {
//     const response = await axios.put(
//       OMS_URL,
//       {
//         excludeNonDispatchedInventory: false,
//         inventories,
//       },
//       {
//         timeout: 10000,
//         headers: {
//           authUsername: "TP_POS-1200062747",
//           authPassword: "f1345f48-af67-42d3-a2f6-ce6dc7826b8b",
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     log.info("OMS inventory push successful", {
//       status: response.status,
//       durationMs: Date.now() - startTime,
//     });

//     // ✅ NORMALIZED RESPONSE (IMPORTANT)
//     return {
//       success: true,
//       successCount: inventories.length,
//       failureCount: 0,
//       failureList: [],
//     };
//   } catch (error) {
//     log.error("OMS inventory push failed", {
//       durationMs: Date.now() - startTime,
//       status: error?.response?.status,
//       errorMessage: error.message,
//       responseData: error?.response?.data,
//       isTimeout: error.code === "ECONNABORTED",
//     });

//     throw error;
//   }
// }

// module.exports = { pushInventory };







const axios = require("axios");

const OMS_URL =
  "https://staging-common-assure.increff.com/assure-magic2/updateInventories";

// structured logger
const log = {
  info: (msg, meta = {}) =>
    console.log(JSON.stringify({ level: "INFO", msg, ...meta })),
  warn: (msg, meta = {}) =>
    console.warn(JSON.stringify({ level: "WARN", msg, ...meta })),
  error: (msg, meta = {}) =>
    console.error(JSON.stringify({ level: "ERROR", msg, ...meta })),
};

async function pushInventory(inventories) {

console.log("Inventories", inventories);


  const startTime = Date.now();

  log.info("OMS inventory push started", {
    url: OMS_URL,
    inventoryCount: inventories.length,
  });

  try {
    const response = await axios.put(
      OMS_URL,
      {
        excludeNonDispatchedInventory: false,
        inventories,
      },
      {
        timeout: 10000,
        headers: {
          authUsername: "TP_POS-1200062747",
          authPassword: "f1345f48-af67-42d3-a2f6-ce6dc7826b8b",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data || {};

    // 🔍 LOG RAW API RESPONSE
    log.info("OMS API raw response", {
      status: response.status,
      response: data,
      durationMs: Date.now() - startTime,
    });

    /**
     * Typical OMS response structure:
     * {
     *   success: true,
     *   successCount: 8,
     *   failureCount: 2,
     *   failures: [...]
     * }
     */

    const success = data.success === true;
    const successCount =
      data.successCount ?? inventories.length - (data.failureCount || 0);
    const failureCount = data.failureCount ?? 0;
    const failureList = data.failures ?? [];

    if (!success || failureCount > 0) {
      log.warn("OMS inventory push partially failed", {
        success,
        successCount,
        failureCount,
        failureList,
      });
    } else {
      log.info("OMS inventory push fully successful", {
        successCount,
      });
    }

    return {
      success,
      successCount,
      failureCount,
      failureList,
      rawResponse: data, // optional: useful for debugging
    };
  } catch (error) {
    log.error("OMS inventory push failed", {
      durationMs: Date.now() - startTime,
      status: error?.response?.status,
      errorMessage: error.message,
      responseData: error?.response?.data,
      isTimeout: error.code === "ECONNABORTED",
    });

    return {
      success: false,
      successCount: 0,
      failureCount: inventories.length,
      failureList: error?.response?.data?.failures || [],
      error: error.message,
    };
  }
}

module.exports = { pushInventory };
