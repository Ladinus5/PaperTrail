const prisma = require("../config/database");

const { generateReceiptPdf } = require("../services/pdfService");

const getPublicReceipt = async (req, res) => {
    try {
        const { token } = req.params;

        const receipt = await prisma.receipt.findUnique({
            where: {
                publicToken: token,
            },
            include: {
                company: true,
                customer: true,
                items: true,
            },
        });

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: "Receipt not found",
            });
        }

        res.status(200).json({
            success: true,
            data: {
                receiptNumber: receipt.receiptNumber,

                company: receipt.company,

                customer: receipt.customer,

                items: receipt.items,

                subtotal: receipt.subtotal,
                discount: receipt.discount,
                tax: receipt.tax,
                total: receipt.total,

                paymentMethod: receipt.paymentMethod,
                paymentStatus: receipt.paymentStatus,

                createdAt: receipt.createdAt,
                pdfUrl: receipt.pdfUrl,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const renderPublicReceipt = async (req, res) => {
    try {
        const { token } = req.params;

        const receipt = await prisma.receipt.findUnique({
            where: {
                publicToken: token,
            },
            include: {
                company: true,
                customer: true,
                items: true,
                template: true,
            },
        });

        if (!receipt) {
            return res.status(404).send("Receipt not found");
        }

        const data = {
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                subtotal: receipt.subtotal,
                discount: receipt.discount,
                tax: receipt.tax,
                total: receipt.total,
                paymentMethod: receipt.paymentMethod,
                paymentStatus: receipt.paymentStatus,
                notes: receipt.notes,
                createdAt: receipt.createdAt,
            },

            company: {
                name: receipt.company.name,
                email: receipt.company.email,
                phone: receipt.company.phone,
                address: receipt.company.address,
                website: receipt.company.website,
                logoUrl: receipt.company.logoUrl,
                currency: receipt.company.currency,
            },

            customer: receipt.customer
                ? {
                    name: receipt.customer.name,
                    email: receipt.customer.email,
                    phone: receipt.customer.phone,
                }
                : null,

            items: receipt.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            })),

            template: receipt.template
                ? {
                    name: receipt.template.name,
                    type: receipt.template.type,
                    settings: receipt.template.settings || {},
                }
                : null,
        };

        const settings = data.template?.settings || {};

        res.render("receipts/modern", {
            ...data,
            settings,
        });

    } catch (error) {
        console.error(error);

        res.status(500).send("Unable to load receipt");
    }
};


const generatePublicReceiptPdf = async (req, res) => {
    try {
        const { token } = req.params;

        const receipt = await prisma.receipt.findUnique({
            where: {
                publicToken: token,
            },
            include: {
                company: true,
                customer: true,
                items: true,
                template: true,
            },
        });

        if (!receipt) {
            return res.status(404).send("Receipt not found");
        }

        const data = {
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                subtotal: receipt.subtotal,
                discount: receipt.discount,
                tax: receipt.tax,
                total: receipt.total,
                paymentMethod: receipt.paymentMethod,
                paymentStatus: receipt.paymentStatus,
                notes: receipt.notes,
                createdAt: receipt.createdAt,
            },

            company: {
                name: receipt.company.name,
                email: receipt.company.email,
                phone: receipt.company.phone,
                address: receipt.company.address,
                website: receipt.company.website,
                logoUrl: receipt.company.logoUrl,
                currency: receipt.company.currency,
            },

            customer: receipt.customer
                ? {
                    name: receipt.customer.name,
                    email: receipt.customer.email,
                    phone: receipt.customer.phone,
                }
                : null,

            items: receipt.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            })),

            template: receipt.template
                ? {
                    name: receipt.template.name,
                    type: receipt.template.type,
                    settings: receipt.template.settings || {},
                }
                : null,
        };

        const settings = data.template?.settings || {};

        // Render EJS into HTML
        res.render(
            "receipts/modern",
            {
                ...data,
                settings,
            },
            async (renderError, html) => {

                if (renderError) {
                    console.error(renderError);

                    return res.status(500).send(
                        "Failed to render receipt"
                    );
                }

                try {

                    // Generate and save PDF
                    const {
                        pdfBuffer,
                        filename,
                    } = await generateReceiptPdf(
                        html,
                        receipt.receiptNumber
                    );

                    // Save PDF URL to database
                    await prisma.receipt.update({
                        where: {
                            id: receipt.id,
                        },
                        data: {
                            pdfUrl: `/api/public/receipts/${receipt.publicToken}/pdf`,
                        },
                    });

                    // Send PDF to browser
                    res.set({
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `inline; filename="${filename}"`,
                        "Content-Length": pdfBuffer.length,
                    });

                    res.send(pdfBuffer);

                } catch (pdfError) {

                    console.error(pdfError);

                    res.status(500).send(
                        "Failed to generate PDF"
                    );
                }
            }
        );

    } catch (error) {
        console.error(error);

        res.status(500).send(
            "Unable to generate receipt PDF"
        );
    }
};


module.exports = {
    getPublicReceipt,
    renderPublicReceipt,
    generatePublicReceiptPdf,
};