function buildFailureHtml(payload, result, description, xml) {
  return `
    <h2>🚨 Busy Voucher Sync Failed</h2>
    <p><b>Order:</b> ${payload.orderCode || "N/A"}</p>
    <p><b>Result:</b> ${result}</p>
    <p><b>Description:</b> ${description}</p>
    <pre style="background:#f6f6f6;padding:10px;border-radius:5px;">
${xml}
    </pre>
  `;
}

function buildExceptionHtml(payload, error, xml) {
  return `
    <h2>🔥 Busy API Exception</h2>
    <p><b>Order:</b> ${payload.orderCode || "N/A"}</p>
    <p><b>Error:</b> ${error.message}</p>
    <pre style="background:#f6f6f6;padding:10px;border-radius:5px;">
${xml}
    </pre>
  `;
}

module.exports = {
  buildFailureHtml,
  buildExceptionHtml,
};