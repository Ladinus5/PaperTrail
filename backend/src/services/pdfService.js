const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const receiptsDirectory = path.join(__dirname, "../../storage/receipts");

const SYMBOLS = { NGN: "₦", USD: "$", GBP: "£", GHS: "₵" };

function currencySymbol(code) {
  return SYMBOLS[code] || "₦";
}

function fmtMoney(n, currency) {
  const sym = currencySymbol(currency);
  const num = Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${num}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const generateReceiptPdf = async (data) => {
  const { receipt, company, customer, items } = data;

  await fs.promises.mkdir(receiptsDirectory, { recursive: true });

  const filename = `${receipt.receiptNumber}.pdf`;
  const filePath = path.join(receiptsDirectory, filename);

  // Cache hit
  try {
    const existingPdf = await fs.promises.readFile(filePath);
    console.log(`Using existing PDF: ${filename}`);
    return { pdfBuffer: existingPdf, filename, filePath, cached: true };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  console.log(`Generating PDF: ${filename}`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));

  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const primary = "#004aad";
  const text = "#191b22";
  const muted = "#585f6c";
  const border = "#c3c6d5";
  const currency = company.currency || "NGN";

  // ─── Header bar ───
  doc.rect(50, 50, 495, 4).fill(primary);

  // ─── Company block ───
  doc.fillColor(primary).fontSize(20).font("Helvetica-Bold")
    .text(company.name.toUpperCase(), 50, 70, { width: 290 });

  doc.fillColor(muted).fontSize(9).font("Helvetica");
  if (company.address) doc.text(company.address, 50, doc.y, { width: 290 });
  if (company.email) doc.text(company.email, 50, doc.y, { width: 290 });
  if (company.phone) doc.text(company.phone, 50, doc.y, { width: 290 });
  if (company.website) doc.text(company.website, 50, doc.y, { width: 290 });

  // ─── Right side: RECEIPT title ───
  doc.fillColor(text).fontSize(22).font("Helvetica-Bold")
    .text("RECEIPT", 350, 70, { width: 195, align: "right" });

  doc.fillColor(muted).fontSize(9).font("Helvetica")
    .text(receipt.receiptNumber, 350, 100, { width: 195, align: "right" })
    .text(fmtDate(receipt.createdAt), 350, 113, { width: 195, align: "right" });

  doc.fillColor(receipt.paymentStatus === "PAID" ? "#15803d" : "#585f6c")
    .fontSize(9).font("Helvetica-Bold")
    .text(receipt.paymentStatus, 350, 130, { width: 195, align: "right" });

  // ─── Billed To ───
  const y = 200;
  doc.fillColor(muted).fontSize(8).font("Helvetica-Bold")
    .text("BILLED TO", 50, y);

  doc.fillColor(text).fontSize(10).font("Helvetica-Bold");
  if (customer) {
    doc.text(customer.name, 50, y + 14, { width: 200 });
    doc.font("Helvetica").fillColor(muted).fontSize(9);
    if (customer.email) doc.text(customer.email, 50, doc.y, { width: 200 });
    if (customer.phone) doc.text(customer.phone, 50, doc.y, { width: 200 });
  } else {
    doc.text("Walk-in Customer", 50, y + 14, { width: 200 });
  }

  // ─── Payment method ───
  doc.fillColor(muted).fontSize(8).font("Helvetica-Bold")
    .text("PAYMENT METHOD", 350, y, { width: 195, align: "right" });
  doc.fillColor(text).fontSize(10).font("Helvetica")
    .text(receipt.paymentMethod, 350, y + 14, { width: 195, align: "right" });

  // ─── Items table ───
  let tableY = 290;

  doc.rect(50, tableY, 495, 22).fill("#f3f3fc");
  doc.fillColor(muted).fontSize(8).font("Helvetica-Bold")
    .text("DESCRIPTION", 58, tableY + 7)
    .text("QTY", 340, tableY + 7, { width: 40, align: "center" })
    .text("UNIT", 390, tableY + 7, { width: 70, align: "right" })
    .text("AMOUNT", 470, tableY + 7, { width: 70, align: "right" });

  tableY += 22;

  items.forEach((item, i) => {
    if (i % 2 === 1) {
      doc.rect(50, tableY, 495, 20).fill("#faf8ff");
    }
    doc.fillColor(text).fontSize(10).font("Helvetica")
      .text(item.name, 58, tableY + 6, { width: 270 })
      .text(String(item.quantity), 340, tableY + 6, { width: 40, align: "center" })
      .text(fmtMoney(item.unitPrice, currency), 390, tableY + 6, { width: 70, align: "right" })
      .text(fmtMoney(item.total, currency), 470, tableY + 6, { width: 70, align: "right" });

    tableY += 20;
  });

  doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor(border).stroke();

  // ─── Totals ───
  tableY += 15;
  const totalsX = 380;

  doc.fillColor(muted).fontSize(10).font("Helvetica")
    .text("Subtotal", totalsX, tableY)
    .text(fmtMoney(receipt.subtotal, currency), totalsX, tableY, { width: 165, align: "right" });

  tableY += 16;

  if (Number(receipt.discount) > 0) {
    doc.text("Discount", totalsX, tableY)
      .text("-" + fmtMoney(receipt.discount, currency), totalsX, tableY, { width: 165, align: "right" });
    tableY += 16;
  }

  if (Number(receipt.tax) > 0) {
    doc.text("Tax", totalsX, tableY)
      .text(fmtMoney(receipt.tax, currency), totalsX, tableY, { width: 165, align: "right" });
    tableY += 16;
  }

  doc.moveTo(totalsX, tableY + 4).lineTo(545, tableY + 4).strokeColor(primary).lineWidth(2).stroke();
  doc.lineWidth(1);

  tableY += 12;
  doc.fillColor(text).fontSize(13).font("Helvetica-Bold")
    .text("Total", totalsX, tableY)
    .fillColor(primary)
    .text(fmtMoney(receipt.total, currency), totalsX, tableY, { width: 165, align: "right" });

  // ─── Notes ───
  if (receipt.notes) {
    tableY += 40;
    doc.fillColor(muted).fontSize(8).font("Helvetica-Bold").text("NOTES", 50, tableY);
    doc.fillColor(text).fontSize(10).font("Helvetica").text(receipt.notes, 50, tableY + 14, { width: 495 });
  }

  // ─── Footer ───
  const footerY = 760;
  doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(border).stroke();
  doc.fillColor(muted).fontSize(9).font("Helvetica")
    .text("Thank you for your business", 50, footerY + 10, { width: 495, align: "center" })
    .text("Powered by Papertrail", 50, footerY + 24, { width: 495, align: "center" });

  doc.end();

  const pdfBuffer = await done;
  await fs.promises.writeFile(filePath, pdfBuffer);
  console.log(`PDF saved: ${filePath}`);

  return { pdfBuffer, filename, filePath, cached: false };
};

module.exports = { generateReceiptPdf };