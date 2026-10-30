const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const addTable = async (req, res, next) => {
  try {
    const tableNo = Number(req.body.tableNo);
    const seats = Number(req.body.seats);
    if (!Number.isInteger(tableNo) || tableNo < 1 || !Number.isInteger(seats) || seats < 1) {
      return next(createHttpError(400, "Provide a valid table number and seat count."));
    }
    const isTablePresent = await Table.findOne({ tableNo });

    if (isTablePresent) {
      return next(createHttpError(409, "Table already exists."));
    }

    const newTable = new Table({ tableNo, seats });
    await newTable.save();
    res
      .status(201)
      .json({ success: true, message: "Table added!", data: newTable });
  } catch (error) {
    next(error);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails"
    });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(createHttpError(404, "Invalid id!"));
    }
    if (req.body.status !== "Available") {
      return next(createHttpError(400, "Tables are booked automatically when an order is placed."));
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { $set: { status: "Available" }, $unset: { currentOrder: 1 } },
      { new: true }
    );

    if (!table) return next(createHttpError(404, "Table not found!"));

    res.status(200).json({success: true, message: "Table updated!", data: table});

  } catch (error) {
    next(error);
  }
};

module.exports = { addTable, getTables, updateTable };
