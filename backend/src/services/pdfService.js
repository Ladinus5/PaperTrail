const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const receiptsDirectory = path.join(
    __dirname,
    "../../storage/receipts"
);

const generateReceiptPdf = async (html, receiptNumber) => {
    await fs.promises.mkdir(receiptsDirectory, {
        recursive: true,
    });

    const filename = `${receiptNumber}.pdf`;

    const filePath = path.join(
        receiptsDirectory,
        filename
    );

    // If PDF already exists, reuse it
    try {
        const existingPdf = await fs.promises.readFile(filePath);

        console.log(`Using existing PDF: ${filename}`);

        return {
            pdfBuffer: existingPdf,
            filename,
            filePath,
            cached: true,
        };

    } catch (error) {
        // File doesn't exist — continue and generate it
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    console.log(`Generating PDF: ${filename}`);

    const browser = await puppeteer.launch({
        headless: true,
    });

    try {
        const page = await browser.newPage();

        await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000,
        });

        // Give fonts + images an extra moment
        await page.evaluateHandle("document.fonts.ready");

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });

        await fs.promises.writeFile(
            filePath,
            pdfBuffer
        );

        console.log(`PDF saved: ${filePath}`);

        return {
            pdfBuffer,
            filename,
            filePath,
            cached: false,
        };

    } finally {
        await browser.close();
    }
};

module.exports = {
    generateReceiptPdf,
};