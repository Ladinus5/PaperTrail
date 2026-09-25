// const fs = require("fs");
// const path = require("path");

// const receiptsDirectory = path.join(__dirname, "../../storage/receipts");

// const generateReceiptPdf = async (html, receiptNumber) => {
//   await fs.promises.mkdir(receiptsDirectory, { recursive: true });

//   const filename = `${receiptNumber}.pdf`;
//   const filePath = path.join(receiptsDirectory, filename);

//   // Cache hit
//   try {
//     const existingPdf = await fs.promises.readFile(filePath);
//     console.log(`Using existing PDF: ${filename}`);
//     return { pdfBuffer: existingPdf, filename, filePath, cached: true };
//   } catch (error) {
//     if (error.code !== "ENOENT") throw error;
//   }

//   console.log(`Generating PDF via PDFMonkey: ${filename}`);

//   const apiKey = process.env.PDFMONKEY_API_KEY;
//   const templateId = process.env.PDFMONKEY_TEMPLATE_ID;

//   if (!apiKey || !templateId) {
//     throw new Error("PDFMonkey credentials missing. Set PDFMONKEY_API_KEY and PDFMONKEY_TEMPLATE_ID.");
//   }

//   // 1. Create document with the rendered HTML as inline payload
//   const createRes = await fetch("https://api.pdfmonkey.io/api/v1/documents", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${apiKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       document: {
//         document_template_id: templateId,
//         status: "pending",
//         payload: {
//           _inline_html: html,
//         },
//       },
//     }),
//   });

//   if (!createRes.ok) {
//     const err = await createRes.text();
//     throw new Error(`PDFMonkey create failed: ${err}`);
//   }

//   const createData = await createRes.json();
//   const docId = createData.document.id;

//   // 2. Poll for completion (usually < 15 seconds)
//   let pdfUrl = null;
//   for (let i = 0; i < 40; i++) {
//     await new Promise((r) => setTimeout(r, 1000));

//     const checkRes = await fetch(`https://api.pdfmonkey.io/api/v1/documents/${docId}`, {
//       headers: { "Authorization": `Bearer ${apiKey}` },
//     });
//     const checkData = await checkRes.json();
//     const status = checkData.document.status;

//     if (status === "success") {
//       pdfUrl = checkData.document.download_url;
//       break;
//     }
//     if (status === "failure" || status === "error") {
//       throw new Error(`PDFMonkey generation failed: ${checkData.document.failure_cause || "unknown"}`);
//     }
//   }

//   if (!pdfUrl) {
//     throw new Error("PDFMonkey generation timed out (40s)");
//   }

//   // 3. Download the PDF
//   const pdfRes = await fetch(pdfUrl);
//   if (!pdfRes.ok) {
//     throw new Error(`Failed to download PDF from PDFMonkey: ${pdfRes.status}`);
//   }

//   const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

//   await fs.promises.writeFile(filePath, pdfBuffer);
//   console.log(`PDF saved: ${filePath}`);

//   return { pdfBuffer, filename, filePath, cached: false };
// };

// module.exports = { generateReceiptPdf };