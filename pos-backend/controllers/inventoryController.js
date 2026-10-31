const createHttpError = require("http-errors");
const { menuStore } = require("../config/inMemoryStore");

const getInventory = async (req, res, next) => {
  try {
    const items = menuStore.getAllItemsWithStock();
    const lowStockCount = items.filter((i) => i.isLowStock || i.isOutOfStock).length;
    const outOfStockCount = items.filter((i) => i.isOutOfStock).length;

    res.status(200).json({
      success: true,
      data: items,
      summary: {
        totalItems: items.length,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, delta } = req.body;

    const items = menuStore.getAllItemsWithStock();
    const currentItem = items.find((i) => String(i._id) === String(id));
    if (!currentItem) {
      return next(createHttpError(404, "Menu item not found in inventory."));
    }

    let newQty;
    if (delta !== undefined) {
      newQty = Math.max(0, currentItem.stockQuantity + Number(delta));
    } else if (quantity !== undefined) {
      newQty = Math.max(0, Number(quantity));
    } else {
      return next(createHttpError(400, "Provide either new quantity or delta to adjust stock."));
    }

    const updated = menuStore.updateStock(id, newQty);
    res.status(200).json({
      success: true,
      message: `Stock updated for ${currentItem.name} to ${newQty} units.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  updateStock
};
