const express = require("express");
const {
  getReservations,
  createReservation,
  updateReservationStatus
} = require("../controllers/reservationController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").get(isVerifiedUser, getReservations);
router.route("/").post(isVerifiedUser, createReservation);
router.route("/:id/status").put(isVerifiedUser, updateReservationStatus);

module.exports = router;
