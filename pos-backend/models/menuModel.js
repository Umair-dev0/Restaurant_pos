const mongoose = require("mongoose");
const { menuStore } = require("../config/inMemoryStore");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (value) => Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      message: "Prices must have no more than two decimal places."
    }
  },
  category: { type: String, required: true, trim: true }
});

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  bgColor: { type: String, default: "#383838" },
  icon: { type: String, default: "🍽️" },
  items: [menuItemSchema]
}, { timestamps: true });

const RealMenuModel = mongoose.model("Menu", menuSchema);

function MenuWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new RealMenuModel(data);
  }
  return {
    ...data,
    save: async () => data
  };
}

MenuWrapper.find = (query) => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.find(query);
  return menuStore.find(query);
};

MenuWrapper.findById = (id) => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.findById(id);
  return menuStore.findById(id);
};

MenuWrapper.create = (data) => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.create(data);
  return menuStore.create(data);
};

MenuWrapper.findOneAndUpdate = (filter, update, options) => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.findOneAndUpdate(filter, update, options);
  return menuStore.findOneAndUpdate(filter, update);
};

MenuWrapper.insertMany = (docs) => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.insertMany(docs);
  return menuStore.insertMany(docs);
};

MenuWrapper.estimatedDocumentCount = () => {
  if (mongoose.connection.readyState === 1) return RealMenuModel.estimatedDocumentCount();
  return menuStore.estimatedDocumentCount();
};

module.exports = MenuWrapper;
