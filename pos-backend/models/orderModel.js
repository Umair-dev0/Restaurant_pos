const mongoose = require("mongoose");
const { orderStore } = require("../config/inMemoryStore");

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
        enum: ["In Progress", "Ready", "Completed", "Cancelled"]
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
    },
    cancelReason: String
}, { timestamps : true } );

const RealOrderModel = mongoose.model("Order", orderSchema);

function OrderWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new RealOrderModel(data);
  }
  return {
    ...data,
    save: async () => data
  };
}

OrderWrapper.create = (data) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.create(data);
  return orderStore.create(data);
};

OrderWrapper.find = (query) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.find(query);
  return orderStore.find(query);
};

OrderWrapper.findById = (id) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.findById(id);
  return orderStore.findById(id);
};

OrderWrapper.findByIdAndUpdate = (id, update, options) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.findByIdAndUpdate(id, update, options);
  return orderStore.findByIdAndUpdate(id, update);
};

OrderWrapper.findByIdAndDelete = (id) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.findByIdAndDelete(id);
  return orderStore.findByIdAndDelete(id);
};

OrderWrapper.countDocuments = (query) => {
  if (mongoose.connection.readyState === 1) return RealOrderModel.countDocuments(query);
  return orderStore.countDocuments(query);
};

module.exports = OrderWrapper;