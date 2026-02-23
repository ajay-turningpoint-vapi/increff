const formatDate = require("./formatDate");

module.exports = function buildBusyXml({ order, items }) {
  const date = formatDate(order.createdAt);

  const itemXml = items
    .map(
      (item, i) =>
        `<ItemDetail><Date>${date}</Date><VchType>4</VchType><SrNo>${i + 1}</SrNo><ItemName>${item.channelSkuCode}</ItemName><UnitName>SQFT</UnitName><Qty>${item.qcPassAbsoluteQuantity || 0}</Qty></ItemDetail>`
    )
    .join("");

  return `<MaterialReceipt><VchSeriesName>TP</VchSeriesName><Date>${date}</Date><VchType>4</VchType><TranType>3</TranType><VchNo>${order.orderCode}</VchNo><STPTName>Local-18%</STPTName><MasterName1>${order.partnerCode}</MasterName1><MasterName2>${order.locationCode}</MasterName2><ItemEntries>${itemXml}</ItemEntries></MaterialReceipt>`;
};