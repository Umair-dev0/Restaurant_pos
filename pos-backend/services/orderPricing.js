const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");
const config = require("../config/config");

const calculateOrderTotals = async (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw createHttpError(400, "Add at least one menu item before placing an order.");
  }

  const itemQuantities = new Map();
  for (const item of requestedItems) {
    if (
      !mongoose.Types.ObjectId.isValid(item.menuItemId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw createHttpError(400, "The order contains an invalid menu item or quantity.");
    }
    itemQuantities.set(item.menuItemId, (itemQuantities.get(item.menuItemId) || 0) + item.quantity);
  }

  const menus = await Menu.find({ "items._id": { $in: [...itemQuantities.keys()] } });
  const availableItems = new Map();
  for (const menu of menus) {
    for (const item of menu.items) {
      availableItems.set(String(item._id), item);
    }
  }

  const items = [...itemQuantities].map(([menuItemId, quantity]) => {
    const menuItem = availableItems.get(menuItemId);
    if (!menuItem) {
      throw createHttpError(400, "One or more selected menu items are no longer available.");
    }

    const unitPriceCents = Math.round(menuItem.price * 100);
    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      pricePerQuantity: unitPriceCents / 100,
      quantity,
      price: (unitPriceCents * quantity) / 100
    };
  });

  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100),
    0
  );
  const taxCents = Math.round(subtotalCents * config.taxRate / 100);

  return {
    items,
    bills: {
      total: subtotalCents / 100,
      tax: taxCents / 100,
      totalWithTax: (subtotalCents + taxCents) / 100
    }
  };
};

module.exports = { calculateOrderTotals };
