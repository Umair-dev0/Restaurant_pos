const mongoose = require("mongoose");
const { paymentStore } = require("../config/inMemoryStore");

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
});

const RealPaymentModel = mongoose.model("Payment", paymentSchema);

function PaymentWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new RealPaymentModel(data);
  }
  return {
    ...data,
    save: async () => data
  };
}

PaymentWrapper.create = async (data) => {
  if (mongoose.connection.readyState === 1) return RealPaymentModel.create(data);
  const p = await paymentStore.create(data);
  return {
    ...p,
    save: async () => p
  };
};

PaymentWrapper.findOne = async (query) => {
  if (mongoose.connection.readyState === 1) return RealPaymentModel.findOne(query);
  const p = await paymentStore.findOne(query);
  if (!p) return null;
  return {
    ...p,
    save: async () => p
  };
};

PaymentWrapper.findOneAndUpdate = async (filter, update, options) => {
  if (mongoose.connection.readyState === 1) return RealPaymentModel.findOneAndUpdate(filter, update, options);
  const p = await paymentStore.findOneAndUpdate(filter, update);
  if (!p) return null;
  return {
    ...p,
    save: async () => p
  };
};

module.exports = PaymentWrapper;