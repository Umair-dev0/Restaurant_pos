const Razorpay = require("razorpay");
const config = require("../config/config");
const crypto = require("crypto");
const Payment = require("../models/paymentModel");
const createHttpError = require("http-errors");
const { calculateOrderTotals } = require("../services/orderPricing");
const Table = require("../models/tableModel");
const mongoose = require("mongoose");

const createOrder = async (req, res, next) => {
  try {
    if (!config.razorpayKeyId || !config.razorpaySecretKey) {
      return next(createHttpError(503, "Online payments are not configured. Select cash or contact an administrator."));
    }

    const { bills } = await calculateOrderTotals(req.body.items);
    const guests = Number(req.body.guests);
    if (!mongoose.Types.ObjectId.isValid(req.body.tableId) || !Number.isInteger(guests) || guests < 1) {
      return next(createHttpError(400, "Select a table and guest count before starting online payment."));
    }
    const tableAvailable = await Table.exists({
      _id: req.body.tableId,
      status: "Available",
      seats: { $gte: guests }
    });
    if (!tableAvailable) {
      return next(createHttpError(409, "The selected table is unavailable or does not have enough seats."));
    }
    const razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpaySecretKey,
    });
    const order = await razorpay.orders.create({
      amount: Math.round(bills.totalWithTax * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await Payment.create({
      orderId: order.id,
      amount: bills.totalWithTax,
      currency: order.currency,
      status: "created"
    });

    res.status(200).json({
      success: true,
      order,
      keyId: config.razorpayKeyId,
      bills
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !config.razorpaySecretKey) {
      return next(createHttpError(400, "Payment verification details are incomplete."));
    }

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(razorpay_signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return next(createHttpError(400, "Payment verification failed!"));
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) return next(createHttpError(400, "Payment order not found or already used."));
    if (payment.paymentId && payment.paymentId !== razorpay_payment_id) {
      return next(createHttpError(400, "Payment id does not match the payment order."));
    }
    if (payment.posOrder) return next(createHttpError(400, "Payment order has already been used."));
    payment.paymentId = razorpay_payment_id;
    payment.status = "verified";
    await payment.save();

    res.json({ success: true, message: "Payment verified successfully!" });
  } catch (error) {
    next(error);
  }
};

const webHookVerification = async (req, res, next) => {
  try {
    const secret = config.razorpayWebhookSecret;
    const signature = req.headers["x-razorpay-signature"];
    if (!secret || !signature || !req.rawBody) {
      return next(createHttpError(400, "Webhook signature or configuration is missing."));
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return next(createHttpError(400, "Invalid webhook signature."));
    }

    if (req.body.event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        {
          paymentId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          createdAt: new Date(payment.created_at * 1000)
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, webHookVerification };
