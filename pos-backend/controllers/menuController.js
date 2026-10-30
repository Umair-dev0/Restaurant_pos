const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");
const config = require("../config/config");

const getMenu = async (req, res, next) => {
  try {
    const categories = await Menu.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories, taxRate: config.taxRate });
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return next(createHttpError(400, "Category name is required."));

    const category = await Menu.create({
      name,
      bgColor: req.body.bgColor || "#383838",
      icon: req.body.icon || "🍽️",
      items: []
    });
    res.status(201).json({ success: true, message: "Category added.", data: category });
  } catch (error) {
    next(error);
  }
};

const addMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid category."));
    }

    const itemName = name?.trim();
    const numericPrice = Number(price);
    if (!itemName || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return next(createHttpError(400, "Provide a dish name and a valid non-negative price."));
    }

    const menu = await Menu.findById(id);
    if (!menu) return next(createHttpError(404, "Category not found."));
    if (menu.items.some((item) => item.name.toLowerCase() === itemName.toLowerCase())) {
      return next(createHttpError(409, "That dish already exists in this category."));
    }

    menu.items.push({ name: itemName, price: numericPrice, category: category?.trim() || "Uncategorized" });
    await menu.save();
    res.status(201).json({ success: true, message: "Dish added.", data: menu });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid menu item."));
    }

    const updates = {};
    if (name !== undefined) updates["items.$.name"] = name.trim();
    if (price !== undefined) updates["items.$.price"] = Number(price);
    if (category !== undefined) updates["items.$.category"] = category.trim();
    if (
      (updates["items.$.name"] !== undefined && !updates["items.$.name"]) ||
      (updates["items.$.price"] !== undefined &&
        (!Number.isFinite(updates["items.$.price"]) || updates["items.$.price"] < 0))
    ) {
      return next(createHttpError(400, "Provide a valid dish name and price."));
    }

    const menu = await Menu.findOneAndUpdate(
      { "items._id": id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!menu) return next(createHttpError(404, "Dish not found."));
    res.status(200).json({ success: true, message: "Dish updated.", data: menu });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "Invalid menu item."));
    }

    const menu = await Menu.findOneAndUpdate(
      { "items._id": id },
      { $pull: { items: { _id: id } } },
      { new: true }
    );
    if (!menu) return next(createHttpError(404, "Dish not found."));
    res.status(200).json({ success: true, message: "Dish removed.", data: menu });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMenu, addCategory, addMenuItem, updateMenuItem, deleteMenuItem };
