const prisma = require("../config/database");

const getCompany = async (req, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.user.company.id },
        });
        res.json({ success: true, data: { company } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateCompany = async (req, res) => {
    try {
        const allowed = [
            "name", "email", "phone", "address", "website", "logoUrl",
            "currency", "receiptPrefix", "tin",
            "bankName", "bankAccountName", "bankAccountNumber", "vatEnabled",
        ];

        const data = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) data[key] = req.body[key];
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields to update" });
        }

        const company = await prisma.company.update({
            where: { id: req.user.company.id },
            data,
        });

        res.json({ success: true, message: "Settings saved", data: { company } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getCompany, updateCompany };