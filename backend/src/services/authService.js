const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const prisma = require("../config/database");

const registerUser = async ({ name, email, password }) => {
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
                    name: `${name}'s Company`,
                },
            },
        },

        include: {
            company: true,
        },
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