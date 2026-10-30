const express = require("express");
const { addTable, getTables, updateTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification")
const { isAdmin } = require("../middlewares/adminVerification");
 
router.route("/").post(isVerifiedUser, isAdmin, addTable);
router.route("/").get(isVerifiedUser , getTables);
router.route("/:id").put(isVerifiedUser, isAdmin, updateTable);

module.exports = router;