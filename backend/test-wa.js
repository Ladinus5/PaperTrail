// require("dotenv").config();
// const { initWhatsApp, sendReceiptDocument, isWhatsAppReady } = require("./src/services/whatsappService");

// (async () => {
//   await initWhatsApp();

//   // Wait for ready event
//   const wait = setInterval(async () => {
//     if (isWhatsAppReady()) {
//       clearInterval(wait);
//       try {
//         const result = await sendReceiptDocument({
//           phone: "09154694050", // e.g. "08012345678"
//           pdfPath: "./storage/receipts/REC-000001.pdf", // use a real PDF you generated
//           filename: "test-receipt.pdf",
//           caption: "Test receipt from Papertrail",
//         });
//         console.log("Sent:", result.id.id);
//         process.exit(0);
//       } catch (err) {
//         console.error("Send failed:", err.message);
//         process.exit(1);
//       }
//     }
//   }, 2000);

//   setTimeout(() => {
//     console.log("Timeout — QR not scanned");
//     process.exit(1);
//   }, 120000);
// })();