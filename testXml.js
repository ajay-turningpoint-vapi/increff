require("dotenv").config();
const axios = require("axios");

async function sendInwardOrderToBusy() {
  // ✅ REPLACED XML (ONE LINE)
  const VchXml =
    "<Sale><VchSeriesName>TP_WMS</VchSeriesName><Date>21-02-2026</Date><VchType>9</VchType><VchNo>123</VchNo><STPTName>Local-18%</STPTName><MasterName1>DEMO ACCOUNT</MasterName1><MasterName2>TURNING POINT</MasterName2><BillingDetails><PartyName>AJAY</PartyName><Address1>PLOT NO. 410 2 H, OPP. CHANDRALOK</Address1><Address2>BUILDING, GIDC VAPI, GIDC VAPI, Valsad</Address2><Address3>Gujarat, 396195</Address3><MobileNo>8975944936</MobileNo><Email>ajay@turningpointvapi.com</Email><tmpVchCode>54827</tmpVchCode><TypeOfDealer>1</TypeOfDealer><tmpFound>True</tmpFound></BillingDetails><ItemEntries><ItemDetail><Date>21-02-2026</Date><VchType>9</VchType><VchNo>1213123</VchNo><SrNo>1</SrNo><ItemName>PLY001</ItemName><UnitName>SQFT</UnitName><AltUnitName>SQFT</AltUnitName><Price>1500</Price><Qty>10</Qty><Amount>15000</Amount></ItemDetail></ItemEntries><BillSundries><BSDetail><SrNo>1</SrNo><BSName>CGST</BSName><PercentVal>9</PercentVal></BSDetail><BSDetail><SrNo>2</SrNo><BSName>SGST</BSName><PercentVal>9</PercentVal></BSDetail></BillSundries></Sale>";
  try {
    const response = await axios.post(process.env.BUSY_URL, "", {
      headers: {
        SC: "2",
        Date: new Date().toISOString().split("T")[0],

        // ✅ Sale Voucher
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

    console.log("✅ Busy Result:", result);
    console.log("📄 Description:", description);
    console.log("📦 Raw Response:", response.data);

    return {
      success: result === "T",
      result,
      description,
    };
  } catch (error) {
    console.error("❌ Busy API Error:", error.message);

    if (error.response) {
      console.error("🔴 Response:", error.response.data);
    }

    throw error;
  }
}

/**
 * RUN TEST
 */
(async () => {
  await sendInwardOrderToBusy();
})();
