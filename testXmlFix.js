const testName = "A & A ENTERPRISES";
const escapeXml = (unsafe) => {
  if (unsafe === undefined || unsafe === null) return "";
  return unsafe.toString().replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
};
console.log(escapeXml(testName));
