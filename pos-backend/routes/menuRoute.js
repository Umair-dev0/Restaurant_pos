const express = require("express");
const {
  getMenu,
  addCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdmin } = require("../middlewares/adminVerification");

const router = express.Router();

router.get("/", isVerifiedUser, getMenu);
router.post("/categories", isVerifiedUser, isAdmin, addCategory);
router.post("/categories/:id/items", isVerifiedUser, isAdmin, addMenuItem);
router.patch("/items/:id", isVerifiedUser, isAdmin, updateMenuItem);
router.delete("/items/:id", isVerifiedUser, isAdmin, deleteMenuItem);

module.exports = router;
