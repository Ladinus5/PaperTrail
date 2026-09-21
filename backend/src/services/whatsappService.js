// const { Client, RemoteAuth, MessageMedia } = require("whatsapp-web.js");
// const { MongoStore } = require("wwebjs-mongo");
// const mongoose = require("mongoose");
// const qrcode = require("qrcode-terminal");
// const fs = require("fs");

// let client = null;
// let isReady = false;

// async function initWhatsApp() {
//   if (client) return client;

//   // Connect to MongoDB (WhatsApp session only)
//   await mongoose.connect(process.env.MONGODB_URI);

//   const store = new MongoStore({ mongoose: mongoose });

//   client = new Client({
//     authStrategy: new RemoteAuth({
//       clientId: "papertrail-main",
//       store: store,
//       backupSyncIntervalMs: 300000, // 5 min
//     }),
//     puppeteer: {
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//       ],
//     },
//   });

//   client.on("qr", (qr) => {
//     console.log("\n📱 Scan this QR code with WhatsApp (Linked Devices):\n");
//     qrcode.generate(qr, { small: true });
//   });

//   client.on("ready", () => {
//     isReady = true;
//     console.log("✅ WhatsApp client ready");
//   });

//   client.on("authenticated", () => {
//     console.log("🔐 WhatsApp authenticated");
//   });

//   client.on("auth_failure", (msg) => {
//     console.error("❌ WhatsApp auth failed:", msg);
//     isReady = false;
//   });

//   client.on("disconnected", (reason) => {
//     console.warn("⚠️ WhatsApp disconnected:", reason);
//     isReady = false;
//     client = null;
//   });

//   client.on("remote_session_saved", () => {
//     console.log("💾 WhatsApp session saved to MongoDB");
//   });

//   client.initialize();
//   return client;
// }

// async function sendReceiptDocument({ phone, pdfPath, filename, caption }) {
//   if (!client || !isReady) {
//     throw new Error("WhatsApp client not ready");
//   }

//   if (!fs.existsSync(pdfPath)) {
//     throw new Error("PDF not found: " + pdfPath);
//   }

//   const digits = String(phone).replace(/\D/g, "");
//   const normalized = digits.startsWith("0") ? "234" + digits.slice(1) : digits;
//   const chatId = `${normalized}@c.us`;

//   const media = MessageMedia.fromFilePath(pdfPath);
//   media.filename = filename || "receipt.pdf";

//   return client.sendMessage(chatId, media, {
//     caption: caption || "",
//     sendMediaAsDocument: true,
//   });
// }

// function isWhatsAppReady() {
//   return isReady;
// }

// module.exports = { initWhatsApp, sendReceiptDocument, isWhatsAppReady };