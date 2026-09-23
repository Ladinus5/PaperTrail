const {
    registerUser,
    loginUser,
} = require("../services/authService");

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Error helper ───
function buildUserMessage(error, scope) {
    console.error(`[auth.${scope}]`, error);

    const isDbError = /P1001|P1000|P1002|P1017|ECONNREFUSED|Can't reach database/i.test(error.message);

    if (isDbError) {
        return "Service temporarily unavailable. Please try again in a moment.";
    }

    if (error.message && error.message.length < 200) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
}

// ─── Register ───
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        const result = await registerUser({ name, email, password });

        res.cookie("token", result.token, cookieOptions);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: buildUserMessage(error, "register"),
        });
    }
};

// ─── Login ───
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const result = await loginUser({ email, password });

        res.cookie("token", result.token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: buildUserMessage(error, "login"),
        });
    }
};

// ─── Logout ───
const logout = (req, res) => {
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    res.status(200).json({ success: true, message: "Logged out" });
};

// ─── Me ───
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                company: req.user.company,
            },
        },
    });
};

module.exports = {
    register,
    login,
    logout,
    getMe,
};