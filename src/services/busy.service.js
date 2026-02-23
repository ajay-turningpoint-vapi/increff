// const axios = require("axios");
// const buildBusyXml = require("../utils/buildBusyXml");
// require("dotenv").config();

// async function sendVoucherToBusy(payload) {
//   try {
//     const VchXml = buildBusyXml(payload);

//     const response = await axios.post(process.env.BUSY_URL, "", {
//       headers: {
//         SC: "2",
//         Date: new Date().toISOString().split("T")[0], // dd-mm-yyyy preferred
//         VchType: "4",
//         TranType: "3",
//         UserName: process.env.BUSY_USER,
//         Pwd: process.env.BUSY_PWD,
//         "Content-Type": "application/xml",
//         VchXml,
//       },
//       maxBodyLength: Infinity,
//       timeout: 15000,
//     });

//     const result = response.headers["result"];
//     const description = response.headers["description"];

//     console.log("Busy Result:", result);
//     console.log("Busy Description:", description);
//     console.log("Busy Data:", response.data);

//     return {
//       success: result === "T",
//       result,
//       description,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error("Busy API Error:", error.message);

//     if (error.response) {
//       console.error("Busy Error Headers:", error.response.headers);
//       console.error("Busy Error Data:", error.response.data);
//     }

//     throw error;
//   }
// }

// module.exports = { sendVoucherToBusy };





const axios = require("axios");
const buildBusyXml = require("../utils/buildBusyXml");
const { sendFailureEmail } = require("../utils/mailer");
const {
  buildFailureHtml,
  buildExceptionHtml,
} = require("../utils/emailTemplates");
require("dotenv").config();

async function sendVoucherToBusy(payload) {
  const VchXml = buildBusyXml(payload);

  try {
    const response = await axios.post(process.env.BUSY_URL, "", {
      headers: {
        SC: "2",
        Date: new Date().toISOString().split("T")[0],
        VchType: "4",
        TranType: "3",
        UserName: process.env.BUSY_USER,
        Pwd: process.env.BUSY_PWD,
        "Content-Type": "application/xml",
        VchXml,
      },
      maxBodyLength: Infinity,
      timeout: 15000,
    });

    const result = response.headers["result"];
    const description = response.headers["description"];

    console.log("Busy Result:", result);
    console.log("Busy Description:", description);

    if (result !== "T") {
      await sendFailureEmail(
        "🚨 Busy Voucher Sync Failed",
        buildFailureHtml(payload, result, description, VchXml)
      );
    }

    return {
      success: result === "T",
      result,
      description,
      data: response.data,
    };

  } catch (error) {
    console.error("Busy API Error:", error.message);

    await sendFailureEmail(
      "🔥 Busy API Down / Network Error",
      buildExceptionHtml(payload, error, VchXml)
    );

    throw error;
  }
}

module.exports = { sendVoucherToBusy };