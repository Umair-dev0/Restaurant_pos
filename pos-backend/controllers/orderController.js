const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const Table = require("../models/tableModel");
const config = require("../config/config");
const { calculateOrderTotals } = require("../services/orderPricing");
const crypto = require("crypto");

const addOrder = async (req, res, next) => {
  let order;
  let claimedPaymentOrderId;
  try {
    const { customerDetails, table, paymentMethod, paymentData } = req.body;
    if (
      !customerDetails?.name?.trim() ||
      !customerDetails?.phone?.trim() ||
      !Number.isInteger(Number(customerDetails?.guests)) ||
      Number(customerDetails.guests) < 1
    ) {
      return next(createHttpError(400, "Provide the customer name, phone number, and guest count."));
    }
    if (!mongoose.Types.ObjectId.isValid(table)) {
      return next(createHttpError(400, "Select a valid table before placing the order."));
    }
    if (!["Cash", "Online"].includes(paymentMethod)) {
      return next(createHttpError(400, "Select a valid payment method."));
    }

    const { items, bills } = await calculateOrderTotals(req.body.items);
    let verifiedPayment;
    if (paymentMethod === "Online") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !config.razorpaySecretKey) {
        return next(createHttpError(400, "Online payment details are missing or invalid."));
      }

      const expectedSignature = crypto
        .createHmac("sha256", config.razorpaySecretKey)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      const expected = Buffer.from(expectedSignature);
      const received = Buffer.from(razorpay_signature);
      if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        return next(createHttpError(400, "Payment verification failed."));
      }

      verifiedPayment = await Payment.findOne({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "verified",
        posOrder: { $exists: false },
        amount: bills.totalWithTax
      });
      if (!verifiedPayment) {
        return next(createHttpError(400, "Payment is not verified for this order amount."));
      }
    }

    order = await Order.create({
      customerDetails: {
        name: customerDetails.name.trim(),
        phone: customerDetails.phone.trim(),
        guests: Number(customerDetails.guests)
      },
      orderStatus: "In Progress",
      bills,
      items,
      table,
      paymentMethod,
      paymentData: paymentMethod === "Online" ? {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id
      } : undefined
    });

    if (verifiedPayment) {
      const claimedPayment = await Payment.findOneAndUpdate(
        {
          _id: verifiedPayment._id,
          status: "verified",
          posOrder: { $exists: false }
        },
        { $set: { posOrder: order._id } },
        { new: true }
      );
      if (!claimedPayment) {
        await Order.findByIdAndDelete(order._id);
        return next(createHttpError(409, "This payment has already been used."));
      }
      claimedPaymentOrderId = verifiedPayment.orderId;
    }

    const reservedTable = await Table.findOneAndUpdate(
      { _id: table, status: "Available", seats: { $gte: Number(customerDetails.guests) } },
      { $set: { status: "Booked", currentOrder: order._id } },
      { new: true }
    );
    if (!reservedTable) {
      await Promise.all([
        Order.findByIdAndDelete(order._id),
        ...(claimedPaymentOrderId ? [
          Payment.findOneAndUpdate(
            { orderId: claimedPaymentOrderId, posOrder: order._id },
            { $unset: { posOrder: 1 } }
          )
        ] : [])
      ]);
      order = null;
      claimedPaymentOrderId = null;
      return next(createHttpError(409, "That table is unavailable or does not have enough seats. Choose another table."));
    }

    res.status(201).json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    if (order) {
      const cleanupResults = await Promise.allSettled([
        Order.findByIdAndDelete(order._id),
        Table.findOneAndUpdate(
          { currentOrder: order._id },
          { $set: { status: "Available" }, $unset: { currentOrder: 1 } }
        ),
        ...(claimedPaymentOrderId ? [
          Payment.findOneAndUpdate(
            { orderId: claimedPaymentOrderId, posOrder: order._id },
            { $unset: { posOrder: 1 } }
          )
        ] : [])
      ]);
      cleanupResults
        .filter((result) => result.status === "rejected")
        .forEach((result) => console.error("Order rollback failed:", result.reason));
    }
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const order = await Order.findById(id).populate("table");
    if (!order) return next(createHttpError(404, "Order not found!"));

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table").sort({ orderDate: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }
    if (!["In Progress", "Ready", "Completed"].includes(orderStatus)) {
      return next(createHttpError(400, "Invalid order status."));
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) return next(createHttpError(404, "Order not found!"));
    const statusRank = { "In Progress": 0, Ready: 1, Completed: 2 };
    if (statusRank[orderStatus] < statusRank[currentOrder.orderStatus]) {
      return next(createHttpError(409, "Order status cannot move backwards."));
    }

    const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true, runValidators: true });

    if (orderStatus === "Completed") {
      await Table.findOneAndUpdate(
        { _id: order.table, currentOrder: order._id },
        { $set: { status: "Available" }, $unset: { currentOrder: 1 } }
      );
    }

    res.status(200).json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

const getOrderQuote = async (req, res, next) => {
  try {
    const quote = await calculateOrderTotals(req.body.items);
    res.status(200).json({ success: true, data: quote, taxRate: config.taxRate });
  } catch (error) {
    next(error);
  }
};

const getOrderStats = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    if (![7, 30, 90].includes(days)) {
      return next(createHttpError(400, "Choose a reporting period of 7, 30, or 90 days."));
    }
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const [orderCount, totals, popularItems] = await Promise.all([
      Order.countDocuments({ orderDate: { $gte: fromDate } }),
      Order.aggregate([
        { $match: { orderDate: { $gte: fromDate } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$bills.totalWithTax" },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "In Progress"] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: fromDate } } },
        { $unwind: "$items" },
        { $match: { "items.menuItemId": { $exists: true } } },
        {
          $group: {
            _id: "$items.menuItemId",
            name: { $first: "$items.name" },
            quantity: { $sum: "$items.quantity" }
          }
        },
        { $sort: { quantity: -1, name: 1 } },
        { $limit: 8 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        orderCount,
        revenue: totals[0]?.revenue || 0,
        inProgress: totals[0]?.inProgress || 0,
        popularItems
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder, getOrderQuote, getOrderStats };
