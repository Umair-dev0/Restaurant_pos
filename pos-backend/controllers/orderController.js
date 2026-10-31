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
      if (!razorpay_order_id || !razorpay_payment_id) {
        return next(createHttpError(400, "Online payment details are missing or invalid."));
      }

      const isDemo = razorpay_order_id.startsWith("order_demo_");
      if (!isDemo) {
        if (!razorpay_signature || !config.razorpaySecretKey) {
          return next(createHttpError(400, "Online payment signature is missing."));
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
      }

      verifiedPayment = await Payment.findOne({
        orderId: razorpay_order_id,
        status: "verified"
      });
      if (!verifiedPayment && !isDemo) {
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
    const { status, page = 1, limit = 50 } = req.query;
    let orders;
    if (typeof Order.find === "function") {
      const query = status ? { orderStatus: status } : {};
      orders = await Order.find(query).populate("table").sort({ orderDate: -1 });
    } else {
      const { orderStore } = require("../config/inMemoryStore");
      orders = await orderStore.find();
      if (status) {
        orders = orders.filter((o) => o.orderStatus === status);
      }
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 50);
    const total = orders.length;
    const paginatedOrders = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      data: paginatedOrders,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
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
    if (!["In Progress", "Ready", "Completed", "Cancelled"].includes(orderStatus)) {
      return next(createHttpError(400, "Invalid order status."));
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) return next(createHttpError(404, "Order not found!"));

    // Role-based transition validation
    if (orderStatus === "Completed" && req.user?.role === "Waiter") {
      return next(createHttpError(403, "Only Cashier or Admin can mark an order as Completed/Paid."));
    }
    if (orderStatus === "Cancelled" && req.user?.role === "Waiter") {
      return next(createHttpError(403, "Only Cashier or Admin can cancel an order."));
    }

    if (orderStatus === "Cancelled") {
      const order = await Order.findByIdAndUpdate(
        id,
        { orderStatus: "Cancelled", cancelReason: req.body.reason || "Cancelled by staff" },
        { new: true }
      );
      const tableId = order.table?._id || order.table;
      await Table.findOneAndUpdate(
        { _id: tableId, currentOrder: order._id },
        { $set: { status: "Available" }, $unset: { currentOrder: 1 } }
      );
      return res.status(200).json({ success: true, message: "Order cancelled and table released.", data: order });
    }

    const statusRank = { "In Progress": 0, Ready: 1, Completed: 2 };
    if (statusRank[orderStatus] !== undefined && statusRank[currentOrder.orderStatus] !== undefined) {
      if (statusRank[orderStatus] < statusRank[currentOrder.orderStatus]) {
        return next(createHttpError(409, "Order status cannot move backwards."));
      }
    }

    const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true, runValidators: true });

    if (orderStatus === "Completed") {
      const tableId = order.table?._id || order.table;
      await Table.findOneAndUpdate(
        { _id: tableId, currentOrder: order._id },
        { $set: { status: "Available" }, $unset: { currentOrder: 1 } }
      );
    }

    res.status(200).json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid order ID."));
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) return next(createHttpError(404, "Order not found!"));

    if (currentOrder.orderStatus === "Completed" && req.user?.role !== "Admin") {
      return next(createHttpError(403, "Only an Administrator can cancel a completed order."));
    }
    if (currentOrder.orderStatus === "Cancelled") {
      return next(createHttpError(400, "Order is already cancelled."));
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus: "Cancelled", cancelReason: reason || "Cancelled by staff" },
      { new: true }
    );

    const tableId = order.table?._id || order.table;
    await Table.findOneAndUpdate(
      { _id: tableId, currentOrder: order._id },
      { $set: { status: "Available" }, $unset: { currentOrder: 1 } }
    );

    res.status(200).json({ success: true, message: "Order cancelled and table released successfully.", data: order });
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
    if (![7, 14, 30, 90].includes(days)) {
      return next(createHttpError(400, "Choose a reporting period of 7, 14, 30, or 90 days."));
    }

    const { orderStore } = require("../config/inMemoryStore");
    const enhancedStats = orderStore.getEnhancedStats(days);

    res.status(200).json({
      success: true,
      data: enhancedStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  cancelOrder,
  getOrderQuote,
  getOrderStats
};
