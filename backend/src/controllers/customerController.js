const prisma = require("../config/database");

const createCustomer = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required",
            });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                companyId: req.user.company.id,
            },
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                companyId: req.user.company.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: customers,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getCustomer = async (req, res) => {
    try {
        const customer = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.company.id,
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const deleteCustomer = async (req, res) => {
    try {
        const customer = await prisma.customer.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.company.id,
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        await prisma.customer.delete({
            where: {
                id: customer.id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


module.exports = {
    createCustomer,
    getCustomers,
    getCustomer,
    deleteCustomer,
};