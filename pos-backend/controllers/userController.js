const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
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

        const normalizedEmail = email.trim().toLowerCase();
        const isUserPresent = await User.findOne({ email: normalizedEmail });
        if(isUserPresent){
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }


        const user = { name: name.trim(), phone: phone.toString().trim(), email: normalizedEmail, password, role };
        const newUser = User(user);
        await newUser.save();

        const publicUser = newUser.toObject();
        delete publicUser.password;
        res.status(201).json({success: true, message: "New user created!", data: publicUser});


    } catch (error) {
        next(error);
    }
}


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

        const publicUser = isUserPresent.toObject();
        delete publicUser.password;
        res.status(200).json({success: true, message: "User login successfully!", data: publicUser});


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




module.exports = { register, login, getUserData, logout }