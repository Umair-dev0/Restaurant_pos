const createHttpError = require("http-errors");
const { reservationStore, tableStore } = require("../config/inMemoryStore");

const getReservations = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const reservations = reservationStore.getAll({ status, date });
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

const createReservation = async (req, res, next) => {
  try {
    const { customerName, phone, email, guests, reservationDate, timeSlot, tableNo, notes } = req.body;

    if (!customerName?.trim() || !phone?.trim() || !reservationDate || !timeSlot) {
      return next(createHttpError(400, "Customer name, phone, reservation date, and time slot are required."));
    }

    const numGuests = Number(guests) || 2;
    if (numGuests < 1) {
      return next(createHttpError(400, "Guest count must be at least 1."));
    }

    const reservation = reservationStore.create({
      customerName,
      phone,
      email,
      guests: numGuests,
      reservationDate,
      timeSlot,
      tableNo: Number(tableNo) || 1,
      notes
    });

    res.status(201).json({ success: true, message: "Reservation confirmed successfully!", data: reservation });
  } catch (error) {
    next(error);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Confirmed", "Seated", "Cancelled"].includes(status)) {
      return next(createHttpError(400, "Status must be Confirmed, Seated, or Cancelled."));
    }

    const updated = reservationStore.updateStatus(id, status);
    if (!updated) {
      return next(createHttpError(404, "Reservation not found."));
    }

    // If seated, also update table status if tableNo provided
    if (status === "Seated" && updated.tableNo) {
      const table = await tableStore.findOne({ tableNo: updated.tableNo });
      if (table && table.status === "Available") {
        await tableStore.findByIdAndUpdate(table._id, { $set: { status: "Booked" } });
      }
    }

    res.status(200).json({ success: true, message: `Reservation marked as ${status}.`, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservationStatus
};
