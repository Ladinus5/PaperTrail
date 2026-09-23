const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const prisma = require("../config/database");

const registerUser = async ({ name, email, password, company }) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            company: {
                create: {
                    name: company?.trim() || `${name}'s Company`,
                    templates: {
                        create: [
                            {
                                name: "Modern Corporate",
                                type: "modern",
                                settings: {
                                    primaryColor: "#004aad",
                                    accentColor: "#f3f3fc",
                                    headerStyle: "bar",
                                    fontFamily: "Inter",
                                    showLogo: true,
                                    showQR: true,
                                    footerText: "Thank you for your business",
                                },
                            },
                            {
                                name: "Classic Ledger",
                                type: "classic",
                                settings: {
                                    primaryColor: "#1e293b",
                                    accentColor: "#f8fafc",
                                    headerStyle: "centered",
                                    fontFamily: "Courier Prime",
                                    showLogo: false,
                                    showQR: false,
                                    footerText: "Retain this receipt for your records",
                                },
                            },
                            {
                                name: "Minimalist Clean",
                                type: "minimal",
                                settings: {
                                    primaryColor: "#0f172a",
                                    accentColor: "#ffffff",
                                    headerStyle: "simple",
                                    fontFamily: "Inter",
                                    showLogo: true,
                                    showQR: true,
                                    footerText: "",
                                },
                            },
                            {
                                name: "Retail Thermal",
                                type: "thermal",
                                settings: {
                                    primaryColor: "#000000",
                                    accentColor: "#ffffff",
                                    headerStyle: "compact",
                                    fontFamily: "Courier Prime",
                                    showLogo: false,
                                    showQR: false,
                                    footerText: "Goods sold in good condition",
                                },
                            },
                        ],
                    },
                },
            },
        },
        include: {
            company: {
                include: { templates: true },
            },
        },
    });

    // Set the first template as default
    await prisma.company.update({
        where: { id: user.company.id },
        data: { defaultTemplateId: user.company.templates[0].id },
    });

    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            company: user.company,
        },
        token,
    };
};


const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            company: true,
        },
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            company: user.company,
        },
        token,
    };
};


module.exports = {
    registerUser,
    loginUser,
};