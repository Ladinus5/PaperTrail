const prisma = require("../config/database");

const createTemplate = async ({ companyId, name, type, settings }) => {
    if (!name || !type) {
        throw new Error("Name and type are required");
    }

    return prisma.receiptTemplate.create({
        data: {
            companyId,
            name,
            type,
            settings: settings || {},
        },
    });
};

const getTemplates = async (companyId) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { defaultTemplateId: true },
    });

    const templates = await prisma.receiptTemplate.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
    });

    return templates.map((t) => ({
        ...t,
        isDefault: t.id === company?.defaultTemplateId,
    }));
};

const getTemplate = async (companyId, templateId) => {
    const template = await prisma.receiptTemplate.findFirst({
        where: { id: templateId, companyId },
    });

    if (!template) {
        throw new Error("Template not found");
    }

    return template;
};

const updateTemplateSettings = async (companyId, templateId, settingsPatch) => {
    if (!settingsPatch || typeof settingsPatch !== "object") {
        throw new Error("settings must be an object");
    }

    const existing = await prisma.receiptTemplate.findFirst({
        where: { id: templateId, companyId },
    });

    if (!existing) {
        throw new Error("Template not found");
    }

    const merged = {
        ...(existing.settings || {}),
        ...settingsPatch,
    };

    return prisma.receiptTemplate.update({
        where: { id: existing.id },
        data: { settings: merged },
    });
};

const setDefaultTemplate = async (companyId, templateId) => {
    const template = await prisma.receiptTemplate.findFirst({
        where: { id: templateId, companyId },
    });

    if (!template) {
        throw new Error("Template not found");
    }

    await prisma.company.update({
        where: { id: companyId },
        data: { defaultTemplateId: template.id },
    });

    return template;
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplateSettings,
    setDefaultTemplate,
};