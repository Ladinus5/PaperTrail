const crypto = require("crypto");
const prisma = require("../config/database");

const createReceipt = async ({
    companyId,
    customerId,
    items,
    discount = 0,
    tax = 0,
    paymentMethod,
    paymentStatus = "PAID",
    notes,
}) => {
    // 1. Validate customer only if provided
    let customer = null;
    if (customerId) {
        customer = await prisma.customer.findFirst({
            where: { id: customerId, companyId },
        });
        if (!customer) {
            throw new Error("Customer not found");
        }
    }

    // 2. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Receipt must contain at least one item");
    }

    // 3. Compute item totals
    const processedItems = items.map((item) => {
        if (!item.name || item.quantity === undefined || item.unitPrice === undefined) {
            throw new Error("Each item must have name, quantity and unitPrice");
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error("Invalid item quantity");
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error("Invalid item unit price");
        }

        return {
            name: String(item.name).trim(),
            quantity,
            unitPrice,
            total: quantity * unitPrice,
        };
    });

    // 4. Subtotal
    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);

    // 5. Discount / tax / total
    const discountAmount = Number(discount) || 0;
    const taxAmount = Number(tax) || 0;

    if (discountAmount < 0 || taxAmount < 0) {
        throw new Error("Discount and tax cannot be negative");
    }

    const total = subtotal - discountAmount + taxAmount;

    if (total < 0) {
        throw new Error("Receipt total cannot be negative");
    }

    // 6. Fetch company (prefix + default template)
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            receiptPrefix: true,
            defaultTemplateId: true,     // ⭐ added
        },
    });

    const prefix = company?.receiptPrefix || "REC";
    const defaultTemplateId = company?.defaultTemplateId || null;   // ⭐ added

    // 7. Generate next receipt number
    const lastReceipt = await prisma.receipt.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: { receiptNumber: true },
    });

    let nextNumber = `${prefix}-000001`;
    if (lastReceipt?.receiptNumber) {
        const match = lastReceipt.receiptNumber.match(/(\d+)$/);
        if (match) {
            nextNumber = `${prefix}-${String(parseInt(match[1], 10) + 1).padStart(6, "0")}`;
        }
    }

    // 8. Public token
    const publicToken = crypto.randomBytes(32).toString("hex");

    // 9. Create receipt + items (nested create is atomic)
    const receipt = await prisma.receipt.create({
        data: {
            receiptNumber: nextNumber,
            publicToken,

            companyId,
            customerId: customer ? customer.id : null,

            templateId: defaultTemplateId,     // ⭐ attach default template

            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total,

            paymentMethod: paymentMethod || "Bank Transfer",
            paymentStatus,
            notes: notes || null,

            items: { create: processedItems },
        },
        include: {
            customer: true,
            items: true,
            template: true,                    // ⭐ include for the response
        },
    });

    return receipt;
};


const assignTemplate = async (companyId, receiptId, templateId) => {
    const receipt = await prisma.receipt.findFirst({
        where: { id: receiptId, companyId },
    });
    if (!receipt) throw new Error("Receipt not found");

    if (templateId) {
        const template = await prisma.receiptTemplate.findFirst({
            where: { id: templateId, companyId },
        });
        if (!template) throw new Error("Template not found");
    }

    return prisma.receipt.update({
        where: { id: receiptId },
        data: { templateId: templateId || null },
        include: { customer: true, items: true, template: true },
    });
};


const getReceipts = async (companyId) => {
    return prisma.receipt.findMany({
        where: { companyId },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
    });
};


const getReceipt = async (companyId, receiptId) => {
    const receipt = await prisma.receipt.findFirst({
        where: { id: receiptId, companyId },
        include: { customer: true, items: true, company: true, template: true },
    });
    if (!receipt) throw new Error("Receipt not found");
    return receipt;
};


const getReceiptForRendering = async (companyId, receiptId) => {
    const receipt = await prisma.receipt.findFirst({
        where: { id: receiptId, companyId },
        include: {
            company: true,
            customer: true,
            items: true,
            template: true,
        },
    });

    if (!receipt) throw new Error("Receipt not found");

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
            publicToken: receipt.publicToken,
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