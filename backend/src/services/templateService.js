const prisma = require("../config/database");

const createTemplate = async ({
    companyId,
    name,
    type,
    settings,
}) => {
    if (!name) {
        throw new Error("Template name is required");
    }

    if (!type) {
        throw new Error("Template type is required");
    }

    const template = await prisma.receiptTemplate.create({
        data: {
            name,
            type,
            settings: settings || {},
            companyId,
        },
    });

    return template;
};


const getTemplates = async (companyId) => {
    return await prisma.receiptTemplate.findMany({
        where: {
            companyId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};


const getTemplate = async (companyId, templateId) => {
    const template = await prisma.receiptTemplate.findFirst({
        where: {
            id: templateId,
            companyId,
        },
    });

    if (!template) {
        throw new Error("Template not found");
    }

    return template;
};


module.exports = {
    createTemplate,
    getTemplates,
    getTemplate,
};