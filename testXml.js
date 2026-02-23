const axios = require("axios");

// Minimal XML for testing
const VchXml =
  "<MaterialReceipt><VchSeriesName>TP</VchSeriesName><Date>20-02-2026</Date><VchType>4</VchType><TranType>3</TranType><VchNo>TVP/8969/25-26</VchNo><STPTName>Local-18%</STPTName><MasterName1>662920</MasterName1><MasterName2>1200062750</MasterName2><ItemEntries><ItemDetail><Date>21-02-2026</Date><VchType>4</VchType><VchNo>1213123</VchNo><SrNo>1</SrNo><ItemName>PLY001</ItemName><UnitName>SQFT</UnitName><AltUnitName>SQFT</AltUnitName><Qty>10</Qty></ItemDetail></ItemEntries></MaterialReceipt>";

axios
  .post("http://192.168.1.11:982", "", {
    // empty body
    headers: {
      SC: "2",
      Date: "21-02-2026",
      VchType: "4",
      TranType: "3",
      UserName: "Nilesh",
      Pwd: "tp@12_34",
      "Content-Type": "application/xml",
      VchXml: VchXml,
    },
    maxBodyLength: Infinity,
  })
  .then((response) => {
    console.log("Headers result:", response.headers.result);
    console.log("Headers description:", response.headers.description);
    console.log("Data:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
