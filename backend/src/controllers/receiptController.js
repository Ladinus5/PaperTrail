const {
    createReceipt,
    getReceipts,
    getReceipt,
    assignTemplate,
    getReceiptForRendering,
} = require("../services/receiptService");


const create = async (req, res) => {
    try {
        const {
            customerId,
            items,
            discount,
            tax,
            paymentMethod,
            paymentStatus,
            notes,
        } = req.body;

        const receipt = await createReceipt({
            companyId: req.user.company.id,
            customerId,
            items,
            discount,
            tax,
            paymentMethod,
            paymentStatus,
            notes,
        });

        res.status(201).json({
            success: true,
            message: "Receipt created successfully",
            data: receipt,
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
        const receipts = await getReceipts(req.user.company.id);

        res.status(200).json({
            success: true,
            data: receipts,
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
        const receipt = await getReceipt(
            req.user.company.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: receipt,
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};


const assignReceiptTemplate = async (req, res) => {
    try {
        const receipt = await assignTemplate(
            req.user.company.id,
            req.params.id,
            req.body.templateId
        );

        res.status(200).json({
            success: true,
            message: "Template assigned successfully",
            data: receipt,
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


const renderData = async (req, res) => {
    try {
        const data = await getReceiptForRendering(
            req.user.company.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};


const renderReceipt = async (req, res) => {
    try {
        const data = await getReceiptForRendering(
            req.user.company.id,
            req.params.id
        );

        const type = receipt.template?.type || "modern";
        const viewName = `receipts/${type}`;
        res.render(viewName, { ...data, settings });

    } catch (error) {
        res.status(404).send(error.message);
    }
};


module.exports = {
    create,
    getAll,
    getOne,
    assignReceiptTemplate,
    renderData,
    renderReceipt,
};