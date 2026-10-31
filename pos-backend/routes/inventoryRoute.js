const express = require("express");
const { getInventory, updateStock } = require("../controllers/inventoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").get(isVerifiedUser, getInventory);
router.route("/:id").put(isVerifiedUser, updateStock);

module.exports = router;
