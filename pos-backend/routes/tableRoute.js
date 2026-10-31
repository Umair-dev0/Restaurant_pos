const express = require("express");
const { addTable, getTables, updateTable, getTableQrCode } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/adminVerification");
 
router.route("/").post(isVerifiedUser, isAdmin, addTable);
router.route("/").get(isVerifiedUser, getTables);
router.route("/:id").put(isVerifiedUser, updateTable);
router.route("/:id/qrcode").get(isVerifiedUser, getTableQrCode);

module.exports = router;