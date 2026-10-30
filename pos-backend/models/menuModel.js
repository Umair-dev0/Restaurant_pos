const mongoose = require("mongoose");

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

module.exports = mongoose.model("Menu", menuSchema);
