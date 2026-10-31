const express = require("express");
const {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  getOrderQuote,
  getOrderStats
} = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/quote").post(isVerifiedUser, getOrderQuote);
router.route("/stats").get(isVerifiedUser, getOrderStats);
router.route("/:id").get(isVerifiedUser, getOrderById).put(isVerifiedUser, updateOrder).patch(isVerifiedUser, updateOrder);
router.route("/:id/cancel").put(isVerifiedUser, cancelOrder).patch(isVerifiedUser, cancelOrder);

module.exports = router;