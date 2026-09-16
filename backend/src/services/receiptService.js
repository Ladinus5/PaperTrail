const crypto = require("crypto");
const prisma = require("../config/database");


const createReceipt = async ({
    companyId,
    customerId,
    items,
    discount = 0,
    tax = 0,
    paymentMethod,
    notes,
}) => {

    // 1. Make sure the customer belongs to this company
    const customer = await prisma.customer.findFirst({
        where: {
            id: customerId,
            companyId,
        },
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // 2. Validate items
    if (!items || items.length === 0) {
        throw new Error("Receipt must contain at least one item");
    }

    // 3. Calculate item totals
    const processedItems = items.map((item) => {
        if (!item.name || !item.quantity || item.unitPrice === undefined) {
            throw new Error(
                "Each item must have name, quantity and unitPrice"
            );
        }

        if (item.quantity <= 0 || item.unitPrice < 0) {
            throw new Error("Invalid quantity or unit price");
        }

        const itemTotal =
            Number(item.quantity) * Number(item.unitPrice);

        return {
            name: item.name,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: itemTotal,
        };
    });

    // 4. Calculate subtotal
    const subtotal = processedItems.reduce(
        (sum, item) => sum + item.total,
        0
    );

    // 5. Calculate final total
    const discountAmount = Number(discount) || 0;
    const taxAmount = Number(tax) || 0;

    if (discountAmount < 0 || taxAmount < 0) {
        throw new Error("Discount and tax cannot be negative");
    }

    const total =
        subtotal -
        discountAmount +
        taxAmount;

    if (total < 0) {
        throw new Error("Receipt total cannot be negative");
    }

    // 6. Generate receipt number
    const receiptCount = await prisma.receipt.count({
        where: {
            companyId,
        },
    });

    const receiptNumber =
    `REC-${String(receiptCount + 1).padStart(6, "0")}`;

const publicToken = crypto.randomBytes(32).toString("hex");

    // 7. Create receipt + items
    const receipt = await prisma.receipt.create({
    data: {
        receiptNumber,
        publicToken,

        companyId,
        customerId,

        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,

        paymentMethod,
        notes,

        items: {
            create: processedItems,
        },
    },

    include: {
        customer: true,
        items: true,
    },
});
    return receipt;
};

const assignTemplate = async (companyId, receiptId, templateId) => {
    const receipt = await prisma.receipt.findFirst({
        where: {
            id: receiptId,
            companyId,
        },
    });

    if (!receipt) {
        throw new Error("Receipt not found");
    }

    const template = await prisma.receiptTemplate.findFirst({
        where: {
            id: templateId,
            companyId,
        },
    });

    if (!template) {
        throw new Error("Template not found");
    }

    return await prisma.receipt.update({
        where: {
            id: receiptId,
        },
        data: {
            templateId,
        },
        include: {
            customer: true,
            items: true,
            template: true,
        },
    });
};

const getReceipts = async (companyId) => {
    return await prisma.receipt.findMany({
        where: {
            companyId,
        },
        include: {
            customer: true,
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};


const getReceipt = async (companyId, receiptId) => {
    const receipt = await prisma.receipt.findFirst({
        where: {
            id: receiptId,
            companyId,
        },
        include: {
            customer: true,
            items: true,
            company: true,
        },
    });

    if (!receipt) {
        throw new Error("Receipt not found");
    }

    return receipt;
};

const getReceiptForRendering = async (companyId, receiptId) => {
    const receipt = await prisma.receipt.findFirst({
        where: {
            id: receiptId,
            companyId,
        },
        include: {
            company: true,
            customer: true,
            items: true,
            template: true,
        },
    });

    if (!receipt) {
        throw new Error("Receipt not found");
    }

    return {
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
};


module.exports = {
    createReceipt,
    getReceipts,
    getReceipt,
    assignTemplate,
     getReceiptForRendering,
};