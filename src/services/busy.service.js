const axios = require("axios");
const {
  buildBusyXml,
  buildInwardOrderBusyXml,
  buildOutwardSaleXml,
  buildPackOrderXml
} = require("../utils/buildBusyXml");

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
        buildFailureHtml(payload, result, description, VchXml),
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
      buildExceptionHtml(payload, error, VchXml),
    );

    throw error;
  }
}

async function sendInwardOrderToBusy(payload) {
  const xml = buildInwardOrderBusyXml(payload);
  const VchXml = xml.replace(/\n|\r/g, ""); // remove line breaks for Busy header

  try {
    const response = await axios.post(process.env.BUSY_URL, "", {
      headers: {
        SC: "2",
        Date: new Date().toISOString().split("T")[0],
        VchType: "3",
        TranType: "3",
        UserName: process.env.BUSY_USER,
        Pwd: process.env.BUSY_PWD,
        "Content-Type": "application/xml",
        VchXml: VchXml,
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
        buildFailureHtml(payload, result, description, VchXml),
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
      buildExceptionHtml(payload, error, VchXml),
    );

    throw error;
  }
}

async function sendOutwardOrderToBusy(payload) {
  const xml = buildOutwardSaleXml(payload.order);
  const VchXml = xml.replace(/\n|\r/g, ""); // remove line breaks for Busy header
  console.log("xml", VchXml);

  try {
    const response = await axios.post(process.env.BUSY_URL, "", {
      headers: {
        SC: "2",
        Date: new Date().toISOString().split("T")[0],
        VchType: "9",
        TranType: "1",
        UserName: process.env.BUSY_USER,
        Pwd: process.env.BUSY_PWD,
        "Content-Type": "application/xml",
        VchXml: VchXml,
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
        buildFailureHtml(payload, result, description, VchXml),
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
      buildExceptionHtml(payload, error, VchXml),
    );

    throw error;
  }
}

async function sendPackOrderToBusy(payload) {
  const xml = buildPackOrderXml(payload);
  const VchXml = xml.replace(/\n|\r|\t/g, ""); // remove line breaks for Busy header


  try {
    const response = await axios.post(process.env.BUSY_URL, "", {
      headers: {
        SC: "2",
        Date: new Date().toISOString().split("T")[0],
        VchType: "9",
        TranType: "1",
        UserName: process.env.BUSY_USER,
        Pwd: process.env.BUSY_PWD,
        "Content-Type": "application/xml",
        VchXml: VchXml,
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
        "🚨 Busy PackOrder Sync Failed",
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
    console.error("Busy API Error (PackOrder):", error.message);

    await sendFailureEmail(
      "🔥 Busy API Down / Network Error",
      buildExceptionHtml(payload, error, VchXml)
    );

    throw error;
  }
}

module.exports = {
  sendVoucherToBusy,
  sendInwardOrderToBusy,
  sendOutwardOrderToBusy,
  sendPackOrderToBusy,
};
