const express = require("express");
const { register, login, getUserData, logout, createStaffUser, getAllStaff } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/adminVerification");
const router = express.Router();

// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout);

router.route("/").get(isVerifiedUser, getUserData);

// Admin-only Staff Management
router.route("/staff").get(isVerifiedUser, isAdmin, getAllStaff);
router.route("/staff").post(isVerifiedUser, isAdmin, createStaffUser);

module.exports = router;