const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');
const BusyInvoice = require('../models/PackedOrderInvoiceURL');

const BUSY_RE = /(?:https?:\/\/)?files\.busy\.in\/[^\s"'&]*/i;

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

exports.getMessage = async (req, res) => {
  console.log('\n================ Incoming Message Request ================');
  try {
    const rawText = req.query.text || req.query.txt || (req.body && req.body.text) || (req.body && req.body.txt) || '';
    console.log("rawText", rawText);


    const txt = decodeURIComponent(rawText);

    console.log(`[1] Received Text: ${txt ? `"${txt.substring(0, 100)}..."` : 'NO TEXT PROVIDED'}`);
    
    let invoiceCode = '';
    let invoiceDate = '';
    if (txt) {
      const lines = txt.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length > 0) {
        const firstLineParts = lines[0].split(',');
        if (firstLineParts.length >= 2) {
          invoiceCode = firstLineParts[0].trim();
          invoiceDate = firstLineParts[1].trim();
        }
      }
    }

    const match = txt.match(BUSY_RE);
    let originalLink = match ? (match[0].startsWith('http') ? match[0] : 'https://' + match[0]) : '';

    if (!originalLink) {
      console.log('❌ [Result] No Busy Link found in text. Aborting.');
      console.log('==========================================================\n');
      return res.send('No txt');
    }

    console.log('✅ [2] Found Busy Link:', originalLink);

    // Fetch the file from Busy
    console.log(`⏳ [3] Downloading file from Busy ERP...`);
    const response = await axios.get(originalLink, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    console.log(`✅ [3] Download complete. File size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Generate a unique file name
    let ext = path.extname(new URL(originalLink).pathname);
    if (!ext) ext = '.pdf'; // Fallback extension
    const fileName = `busy_invoices/busy_${crypto.randomUUID()}${ext}`;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Upload to S3
    console.log(`⏳ [4] Uploading to AWS S3 bucket "${bucketName}" as "${fileName}"...`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: response.headers['content-type'] || 'application/pdf'
    });

    await s3Client.send(command);

    // Generate S3 Link
    const newLink = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
    console.log('✅ [5] Uploaded successfully to S3!');

    // Save to Database
    console.log(`⏳ [6] Saving details to MongoDB...`);
    try {
      const parsedInvoiceCode = invoiceCode || 'UNKNOWN';
      const parsedDate = invoiceDate || new Date().toISOString().split('T')[0];

      await BusyInvoice.findOneAndUpdate(
        { invoiceCode: parsedInvoiceCode },
        {
          invoiceCode: parsedInvoiceCode,
          date: parsedDate,
          invoiceUrl: newLink
        },
        { new: true, upsert: true }
      );
      console.log('✅ [7] Saved/Updated successfully in DB!');
    } catch (dbError) {
      console.error('❌ [Error] Failed to save/update in DB:', dbError.message);
    }

    console.log(`🔗 [Result] New S3 Link: ${newLink}`);
    console.log('==========================================================\n');

    // Return the new S3 link
    res.send(newLink);

  } catch (error) {
    console.error('❌ [Error] Processing message link failed:', error.message);
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
    }
    console.log('==========================================================\n');
    res.status(500).send('Error processing the file link');
  }
};
 