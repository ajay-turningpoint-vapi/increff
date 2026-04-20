const formatDate = require("./formatDate");

function buildBusyXml({ order, items }) {
  const date = formatDate(order.createdAt);

  const itemXml = items
    .map(
      (item, i) =>
        `<ItemDetail><Date>${date}</Date><VchType>4</VchType><SrNo>${i + 1}</SrNo><ItemName>${item.channelSkuCode}</ItemName><UnitName>SQFT</UnitName><Qty>${item.qcPassAbsoluteQuantity || 0}</Qty></ItemDetail>`,
    )
    .join("");

  return `<MaterialReceipt><VchSeriesName>TP</VchSeriesName><Date>${date}</Date><VchType>4</VchType><TranType>3</TranType><VchNo>${order.orderCode}</VchNo><STPTName>Local-18%</STPTName><MasterName1>${order.partnerCode}</MasterName1><MasterName2>${order.locationCode}</MasterName2><ItemEntries>${itemXml}</ItemEntries></MaterialReceipt>`;
}

function buildInwardOrderBusyXml({ order, items }) {
  const date = formatDate(order.orderTime);

  const itemXml = items
    .map(
      (item, i) =>
        `<ItemDetail><Date>${date}</Date><VchType>3</VchType><VchNo>${order.orderCode}</VchNo><SrNo>${i + 1}</SrNo><ItemName>${item.channelSkuCode}</ItemName><UnitName>${item.unit || "PCS"}</UnitName><AltUnitName>${item.unit || "PCS"}</AltUnitName><Qty>${item.quantity}</Qty></ItemDetail>`,
    )
    .join("");

  return `<SaleReturn><VchSeriesName>TP_SR_TAX</VchSeriesName><Date>${date}</Date><VchType>3</VchType><VchNo>${order.orderCode}</VchNo><STPTName>Local-18%</STPTName><MasterName1>${order.partnerCode}</MasterName1><MasterName2>TURNING POINT</MasterName2><ItemEntries>${itemXml}</ItemEntries></SaleReturn>`;
}

function buildOutwardSaleXml(order) {
  const date = formatDate(order.orderTime);

  // 🧾 Item Entries
  const itemsXML = (order.orderItems || [])
    .map((item, i) => {
      const price = item.sellingPricePerUnit || 0;
      const qty = item.orderedQuantity || 0;

      return `<ItemDetail><Date>${date}</Date><VchType>9</VchType><VchNo>${order.orderCode}</VchNo><SrNo>${i + 1}</SrNo><ItemName>${item.channelSkuCode}</ItemName><UnitName>PCS</UnitName><AltUnitName>PCS</AltUnitName><Price>${price}</Price><Qty>${qty}</Qty></ItemDetail>`;
    })
    .join("");

  // 💰 TAX AGGREGATION (ALL shipments + ALL items)
  const taxMap = {};

  (order.shipments || []).forEach((shipment) => {
    (shipment.shipmentItems || []).forEach((sItem) => {
      (sItem.taxItems || []).forEach((tax) => {
        if (!taxMap[tax.type]) {
          taxMap[tax.type] = tax.rate;
        }
      });
    });
  });

  const taxXML = Object.entries(taxMap)
    .map(
      ([type, rate], i) =>
        `<BSDetail><SrNo>${i + 1}</SrNo><BSName>${type}</BSName><PercentVal>${rate}</PercentVal></BSDetail>`,
    )
    .join("");

  // 🏢 Billing
  const billing = order.billingAddress || {};

  return `<Sale><VchSeriesName>TP_WMS</VchSeriesName><Date>${date}</Date><VchType>9</VchType><VchNo>${order.orderCode}</VchNo><STPTName>Local-18%</STPTName><MasterName1>${order.partnerCode}</MasterName1><MasterName2>TURNING POINT</MasterName2><BillingDetails><PartyName>${billing.name || ""}</PartyName><Address1>${billing.line1 || ""}</Address1><Address2>${billing.line2 || ""}</Address2><Address3>${billing.line3 || ""}</Address3><MobileNo>${billing.phone || ""}</MobileNo><Email>${billing.email || ""}</Email><tmpVchCode>54827</tmpVchCode><TypeOfDealer>1</TypeOfDealer><tmpFound>True</tmpFound></BillingDetails><ItemEntries>${itemsXML}</ItemEntries><BillSundries>${taxXML}</BillSundries></Sale>`;
}

const escapeXml = (unsafe) => {
  if (unsafe === undefined || unsafe === null) return "";
  return unsafe.toString().replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
  });
};

function buildPackOrderXml(packOrder) {
  const date = formatDate(packOrder.invoice?.orderTime || new Date());
  const billing = packOrder.invoice?.billingAddress || {};
  const toTIN = packOrder.invoice?.toTIN || "";
  const panNo = packOrder.invoice?.panNo || "";

  const extractAutoVchNo = (orderCode) => {
    if (!orderCode) return "";
    const parts = orderCode.split("/");
    if (parts.length > 1) {
      const match = parts[1].match(/\d+/);
      return match ? match[0] : "";
    }
    return "";
  };
  const autoVchNo = extractAutoVchNo(packOrder.orderCode);

  const itemsXML = (packOrder.invoice?.invoiceItems || [])
    .map((item, i) => {
      const taxCategory = item.taxRule
        ? item.taxRule.replace("GST_", "") + "%"
        : "18%";
      return `<ItemDetail><Date>${date}</Date><VchType>9</VchType><VchNo>${escapeXml(packOrder.orderCode)}</VchNo><SrNo>${i + 1}</SrNo><ItemName>${escapeXml(item.channelSkuCode || item.itemName)}</ItemName><UnitName>PCS</UnitName><AltUnitName>PCS</AltUnitName><ConFactor>1</ConFactor><Qty>${item.quantity || 0}</Qty><QtyMainUnit>${item.quantity || 0}</QtyMainUnit><QtyAltUnit>${item.quantity || 0}</QtyAltUnit><ItemHSNCode>${escapeXml(item.hsnCode)}</ItemHSNCode><ItemTaxCategory>${taxCategory}</ItemTaxCategory><ItemDescInfo/><Price>${item.actualSellingPricePerUnit || 0}</Price><PriceAltUnit>${item.actualSellingPricePerUnit || 0}</PriceAltUnit><ListPrice>${item.actualSellingPricePerUnit || 0}</ListPrice></ItemDetail>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="iso8859-1"?><Sale><VchSeriesName>TP_TAX</VchSeriesName><Date>${date}</Date><VchType>9</VchType><VchNo>${escapeXml(packOrder.orderCode)}</VchNo><AutoVchNo>${autoVchNo}</AutoVchNo><STPTName>L/GST-MultiRate</STPTName><MasterName1>${escapeXml(billing.name)}</MasterName1><MasterName2>TURNING POINT</MasterName2><BillingDetails><PartyName>${escapeXml(billing.name)}</PartyName><Address1>${escapeXml(billing.line1)}</Address1><Address2>${escapeXml(billing.line2)}</Address2><Address3>${escapeXml(billing.line3)}</Address3><Address4></Address4><MobileNo>${escapeXml(billing.phone)}</MobileNo><Email>${escapeXml(billing.email)}</Email><CSTNo></CSTNo><tmpVchCode>54827</tmpVchCode><ITPAN>${escapeXml(panNo)}</ITPAN><tmpStateName>${escapeXml(billing.state)}</tmpStateName><GSTNo>${escapeXml(toTIN)}</GSTNo></BillingDetails><VchOtherInfoDetails><OFInfo><OF3>${packOrder.orderCustomAttributes.attribute1}</OF3></OFInfo></VchOtherInfoDetails><ItemEntries>${itemsXML}</ItemEntries></Sale>`;
}

module.exports = {
  buildBusyXml,
  buildInwardOrderBusyXml,
  buildOutwardSaleXml,
  buildPackOrderXml,
};
