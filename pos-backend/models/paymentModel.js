const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, unique: true, sparse: true },
    orderId: { type: String, required: true, unique: true, sparse: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, required: true },
    posOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    method: String,
    email: String,
    contact: String,
    createdAt: Date
})

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;