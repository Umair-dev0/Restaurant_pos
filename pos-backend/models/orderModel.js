const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    pricePerQuantity: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        guests: { type: Number, required: true, min: 1 },
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ["In Progress", "Ready", "Completed"]
    },
    orderDate: {
        type: Date,
        default : Date.now
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "Orders must contain at least one item."] },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    paymentMethod: { type: String, enum: ["Cash", "Online"], required: true },
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    }
}, { timestamps : true } );

module.exports = mongoose.model("Order", orderSchema);