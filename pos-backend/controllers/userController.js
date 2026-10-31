const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {
        const { name, phone, email, password, role } =
            req.body && typeof req.body === "object" ? req.body : {};

        if (
            typeof name !== "string" ||
            !name.trim() ||
            (typeof phone !== "string" && typeof phone !== "number") ||
            !String(phone).trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password ||
            typeof role !== "string" ||
            !role.trim()
        ) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        // SECURITY FIX: Prevent public registration from assigning Admin role
        const sanitizedRole = role.trim();
        if (sanitizedRole === "Admin") {
            const error = createHttpError(403, "Public registration cannot create Admin accounts. Only an existing Administrator can create Admin users.");
            return next(error);
        }
        if (!["Waiter", "Cashier"].includes(sanitizedRole)) {
            const error = createHttpError(400, "Invalid role. Public registration only allows Waiter or Cashier.");
            return next(error);
        }

        const normalizedEmail = email.trim().toLowerCase();
        const isUserPresent = await User.findOne({ email: normalizedEmail });
        if(isUserPresent){
            const error = createHttpError(400, "User already exists!");
            return next(error);
        }

        const user = { name: name.trim(), phone: phone.toString().trim(), email: normalizedEmail, password, role: sanitizedRole };
        const newUser = User(user);
        await newUser.save();

        const publicUser = newUser.toObject ? newUser.toObject() : { ...newUser };
        delete publicUser.password;
        res.status(201).json({success: true, message: "New employee account created!", data: publicUser});

    } catch (error) {
        next(error);
    }
}

// Admin-only Staff Creation endpoint
const createStaffUser = async (req, res, next) => {
    try {
        const { name, phone, email, password, role } = req.body || {};
        if (!name?.trim() || !phone || !email?.trim() || !password || !role) {
            return next(createHttpError(400, "All staff fields (name, phone, email, password, role) are required."));
        }
        if (!["Admin", "Waiter", "Cashier"].includes(role)) {
            return next(createHttpError(400, "Role must be Admin, Waiter, or Cashier."));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const isUserPresent = await User.findOne({ email: normalizedEmail });
        if (isUserPresent) {
            return next(createHttpError(400, "User already exists with this email!"));
        }

        const user = { name: name.trim(), phone: String(phone).trim(), email: normalizedEmail, password, role };
        const newUser = User(user);
        await newUser.save();

        const publicUser = newUser.toObject ? newUser.toObject() : { ...newUser };
        delete publicUser.password;
        res.status(201).json({ success: true, message: `${role} account created successfully!`, data: publicUser });
    } catch (error) {
        next(error);
    }
};

const getAllStaff = async (req, res, next) => {
    try {
        const { userStore } = require("../config/inMemoryStore");
        let staffList;
        if (typeof User.find === "function") {
            staffList = await User.find().select("-password");
        } else {
            staffList = await userStore.find();
        }
        res.status(200).json({ success: true, data: staffList });
    } catch (error) {
        next(error);
    }
};


const login = async (req, res, next) => {

    try {
        
        const { email, password } =
            req.body && typeof req.body === "object" ? req.body : {};

        if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email: email.trim().toLowerCase() });
        if(!isUserPresent){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if(!isMatch){
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const accessToken = jwt.sign({_id: isUserPresent._id}, config.accessTokenSecret, {
            expiresIn : '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            sameSite: "none",
            secure: true
        })

        const publicUser = isUserPresent.toObject ? isUserPresent.toObject() : { ...isUserPresent };
        delete publicUser.password;
        res.status(200).json({
            success: true,
            message: "User login successfully!",
            token: accessToken,
            data: publicUser
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {
        
        const user = await User.findById(req.user._id).select("-password");
        if (!user) return next(createHttpError(404, "User not found."));
        res.status(200).json({success: true, data: user});

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        
        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });
        res.status(200).json({success: true, message: "User logout successfully!"});

    } catch (error) {
        next(error);
    }
}




module.exports = { register, login, getUserData, logout, createStaffUser, getAllStaff };