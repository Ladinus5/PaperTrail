const {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplateSettings,
    setDefaultTemplate,
} = require("../services/templateService");


const create = async (req, res) => {
    try {
        const { name, type, settings } = req.body;

        const template = await createTemplate({
            companyId: req.user.company.id,
            name,
            type,
            settings,
        });

        res.status(201).json({
            success: true,
            message: "Template created successfully",
            data: template,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


const getAll = async (req, res) => {
    try {
        const templates = await getTemplates(req.user.company.id);

        res.status(200).json({
            success: true,
            data: templates,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getOne = async (req, res) => {
    try {
        const template = await getTemplate(
            req.user.company.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: template,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};


const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        const template = await updateTemplateSettings(
            req.user.company.id,
            req.params.id,
            settings
        );

        res.status(200).json({
            success: true,
            message: "Template settings updated",
            data: template,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


const setDefault = async (req, res) => {
    try {
        const template = await setDefaultTemplate(
            req.user.company.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Default template updated",
            data: template,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


module.exports = {
    create,
    getAll,
    getOne,
    updateSettings,
    setDefault,
};