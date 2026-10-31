const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const defaultMenu = require("./defaultMenu.json");

const createId = () => new mongoose.Types.ObjectId().toString();

// Initialize Menus with valid ObjectIds and inventory stock tracking
let itemCounter = 0;
const initialMenu = defaultMenu.map((cat) => ({
  _id: createId(),
  name: cat.name,
  bgColor: cat.bgColor || "#383838",
  icon: cat.icon || "🍽️",
  items: cat.items.map((item) => {
    itemCounter++;
    // Introduce realistic stock counts
    let stock = 30;
    if (itemCounter === 2) stock = 4; // Low stock demo
    if (itemCounter === 5) stock = 2; // Critical low stock
    if (itemCounter === 8) stock = 0; // Out of stock demo
    return {
      _id: createId(),
      name: item.name,
      price: Number(item.price),
      category: item.category || "General",
      stockQuantity: stock,
      lowStockThreshold: 10
    };
  })
}));

// Initialize 15 tables
const initialTables = Array.from({ length: 15 }, (_, i) => ({
  _id: createId(),
  tableNo: i + 1,
  seats: i % 3 === 0 ? 6 : i % 2 === 0 ? 2 : 4,
  status: "Available",
  currentOrder: null
}));

// Seed demo staff users
const salt = bcrypt.genSaltSync(10);
const initialUsers = [
  {
    _id: createId(),
    name: "Admin Manager",
    email: "admin@restro.com",
    phone: "9876543210",
    password: bcrypt.hashSync("admin123", salt),
    role: "Admin"
  },
  {
    _id: createId(),
    name: "Alex Waiter",
    email: "waiter@restro.com",
    phone: "9876543211",
    password: bcrypt.hashSync("waiter123", salt),
    role: "Waiter"
  },
  {
    _id: createId(),
    name: "Sam Cashier",
    email: "cashier@restro.com",
    phone: "9876543212",
    password: bcrypt.hashSync("cashier123", salt),
    role: "Cashier"
  }
];

// Seed sample orders across the last 7 days for rich dashboard charts
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

const initialOrders = [
  {
    _id: createId(),
    customerDetails: { name: "Rahul Sharma", phone: "9876543210", guests: 2 },
    orderStatus: "In Progress",
    orderDate: new Date(now - 1800000), // 30 mins ago
    bills: { total: 650, tax: 34.13, totalWithTax: 684.13 },
    items: [
      { menuItemId: initialMenu[0].items[0]._id, name: initialMenu[0].items[0].name, pricePerQuantity: 250, quantity: 1, price: 250 },
      { menuItemId: initialMenu[1].items[0]._id, name: initialMenu[1].items[0].name, pricePerQuantity: 400, quantity: 1, price: 400 }
    ],
    table: initialTables[0]._id,
    paymentMethod: "Cash"
  },
  {
    _id: createId(),
    customerDetails: { name: "Priya Patel", phone: "9876543211", guests: 4 },
    orderStatus: "Ready",
    orderDate: new Date(now - 5400000), // 1.5 hours ago
    bills: { total: 1100, tax: 57.75, totalWithTax: 1157.75 },
    items: [
      { menuItemId: initialMenu[1].items[2]._id, name: "Chicken Biryani", pricePerQuantity: 450, quantity: 2, price: 900 },
      { menuItemId: initialMenu[0].items[3]._id, name: "Samosa", pricePerQuantity: 100, quantity: 2, price: 200 }
    ],
    table: initialTables[2]._id,
    paymentMethod: "Cash"
  },
  {
    _id: createId(),
    customerDetails: { name: "Amit Verma", phone: "9876543212", guests: 3 },
    orderStatus: "Completed",
    orderDate: new Date(now - oneDay * 0.5),
    bills: { total: 1450, tax: 76.13, totalWithTax: 1526.13 },
    items: [
      { menuItemId: initialMenu[1].items[0]._id, name: "Butter Chicken", pricePerQuantity: 400, quantity: 2, price: 800 },
      { menuItemId: initialMenu[0].items[1]._id, name: "Chicken Tikka", pricePerQuantity: 300, quantity: 1, price: 300 },
      { menuItemId: initialMenu[1].items[1]._id, name: "Paneer Butter Masala", pricePerQuantity: 350, quantity: 1, price: 350 }
    ],
    table: initialTables[3]._id,
    paymentMethod: "Cash"
  },
  {
    _id: createId(),
    customerDetails: { name: "Neha Gupta", phone: "9876543213", guests: 2 },
    orderStatus: "Completed",
    orderDate: new Date(now - oneDay * 1.2),
    bills: { total: 850, tax: 44.63, totalWithTax: 894.63 },
    items: [
      { menuItemId: initialMenu[1].items[2]._id, name: "Chicken Biryani", pricePerQuantity: 450, quantity: 1, price: 450 },
      { menuItemId: initialMenu[1].items[0]._id, name: "Butter Chicken", pricePerQuantity: 400, quantity: 1, price: 400 }
    ],
    table: initialTables[4]._id,
    paymentMethod: "Online"
  },
  {
    _id: createId(),
    customerDetails: { name: "Kunal Singh", phone: "9876543214", guests: 5 },
    orderStatus: "Completed",
    orderDate: new Date(now - oneDay * 2.1),
    bills: { total: 2100, tax: 110.25, totalWithTax: 2210.25 },
    items: [
      { menuItemId: initialMenu[0].items[2]._id, name: "Tandoori Chicken", pricePerQuantity: 350, quantity: 2, price: 700 },
      { menuItemId: initialMenu[1].items[2]._id, name: "Chicken Biryani", pricePerQuantity: 450, quantity: 2, price: 900 },
      { menuItemId: initialMenu[0].items[0]._id, name: "Paneer Tikka", pricePerQuantity: 250, quantity: 2, price: 500 }
    ],
    table: initialTables[5]._id,
    paymentMethod: "Cash"
  },
  {
    _id: createId(),
    customerDetails: { name: "Rohan Kapoor", phone: "9876543215", guests: 2 },
    orderStatus: "Completed",
    orderDate: new Date(now - oneDay * 3.4),
    bills: { total: 950, tax: 49.88, totalWithTax: 999.88 },
    items: [
      { menuItemId: initialMenu[1].items[0]._id, name: "Butter Chicken", pricePerQuantity: 400, quantity: 1, price: 400 },
      { menuItemId: initialMenu[0].items[1]._id, name: "Chicken Tikka", pricePerQuantity: 300, quantity: 1, price: 300 },
      { menuItemId: initialMenu[0].items[0]._id, name: "Paneer Tikka", pricePerQuantity: 250, quantity: 1, price: 250 }
    ],
    table: initialTables[1]._id,
    paymentMethod: "Online"
  }
];

// Mark tables with active orders as Booked
initialTables[0].status = "Booked";
initialTables[0].currentOrder = initialOrders[0]._id;

initialTables[2].status = "Booked";
initialTables[2].currentOrder = initialOrders[1]._id;

// Seed upcoming table reservations
const initialReservations = [
  {
    _id: createId(),
    customerName: "Vikram Malhotra",
    phone: "9812345678",
    email: "vikram@example.com",
    guests: 4,
    reservationDate: new Date(now + 86400000).toISOString().split("T")[0], // Tomorrow
    timeSlot: "19:30",
    tableNo: 4,
    tableId: initialTables[3]._id,
    status: "Confirmed",
    notes: "Window side table requested for anniversary dinner",
    createdAt: new Date()
  },
  {
    _id: createId(),
    customerName: "Simran Kaur",
    phone: "9876501234",
    email: "simran@example.com",
    guests: 6,
    reservationDate: new Date(now + 86400000 * 2).toISOString().split("T")[0], // Day after tomorrow
    timeSlot: "20:00",
    tableNo: 1,
    tableId: initialTables[0]._id,
    status: "Confirmed",
    notes: "Family birthday gathering",
    createdAt: new Date()
  }
];

const state = {
  users: [...initialUsers],
  menus: [...initialMenu],
  tables: [...initialTables],
  orders: [...initialOrders],
  payments: [],
  reservations: [...initialReservations]
};

// User methods
const userStore = {
  findOne: async (query) => {
    if (query?.email) {
      const email = query.email.toLowerCase().trim();
      const u = state.users.find((user) => user.email.toLowerCase() === email);
      if (!u) return null;
      return {
        ...u,
        toObject: () => ({ ...u })
      };
    }
    return null;
  },
  findById: (id) => {
    const idStr = String(id?._id || id);
    const u = state.users.find((user) => String(user._id) === idStr);
    const result = u ? { ...u, toObject: () => ({ ...u }) } : null;
    const promise = Promise.resolve(result);
    promise.select = (fields) => {
      if (!result) return Promise.resolve(null);
      const copy = { ...result };
      if (fields && fields.includes("-password")) delete copy.password;
      return Promise.resolve(copy);
    };
    return promise;
  },
  create: async (data) => {
    const s = bcrypt.genSaltSync(10);
    const newUser = {
      _id: createId(),
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: String(data.phone).trim(),
      password: data.password.startsWith("$2a$") || data.password.startsWith("$2b$")
        ? data.password
        : bcrypt.hashSync(data.password, s),
      role: data.role || "Waiter"
    };
    state.users.push(newUser);
    return {
      ...newUser,
      toObject: () => ({ ...newUser })
    };
  },
  find: async () => state.users.map((u) => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  })
};

// Menu & Inventory methods
const menuStore = {
  estimatedDocumentCount: async () => state.menus.length,
  insertMany: async (items) => {
    state.menus.push(...items);
    return items;
  },
  find: (query) => {
    let result = [...state.menus];
    if (query && query["items._id"]) {
      const ids = query["items._id"]["$in"]?.map(String) || [];
      result = state.menus.filter((cat) => cat.items.some((i) => ids.includes(String(i._id))));
    }
    const promise = Promise.resolve(result.map((m) => ({ ...m, items: [...m.items] })));
    promise.sort = (sortObj) => {
      if (sortObj?.name) {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }
      return Promise.resolve(result.map((m) => ({ ...m, items: [...m.items] })));
    };
    return promise;
  },
  findById: async (id) => {
    const idStr = String(id?._id || id);
    const cat = state.menus.find((m) => String(m._id) === idStr);
    if (!cat) return null;
    const catCopy = {
      ...cat,
      items: [...cat.items],
      save: async () => {
        const idx = state.menus.findIndex((m) => String(m._id) === idStr);
        if (idx !== -1) {
          state.menus[idx] = catCopy;
        }
        return catCopy;
      }
    };
    return catCopy;
  },
  create: async (data) => {
    const newCat = {
      _id: createId(),
      name: data.name,
      bgColor: data.bgColor || "#383838",
      icon: data.icon || "🍽️",
      items: []
    };
    state.menus.push(newCat);
    return newCat;
  },
  findOneAndUpdate: async (filter, update) => {
    if (filter["items._id"]) {
      const itemId = String(filter["items._id"]);
      for (const cat of state.menus) {
        const itemIdx = cat.items.findIndex((i) => String(i._id) === itemId);
        if (itemIdx !== -1) {
          if (update["$pull"]) {
            cat.items.splice(itemIdx, 1);
            return cat;
          }
          if (update["$set"]) {
            const setObj = update["$set"];
            if (setObj["items.$.name"] !== undefined) cat.items[itemIdx].name = setObj["items.$.name"];
            if (setObj["items.$.price"] !== undefined) cat.items[itemIdx].price = setObj["items.$.price"];
            if (setObj["items.$.category"] !== undefined) cat.items[itemIdx].category = setObj["items.$.category"];
            if (setObj["items.$.stockQuantity"] !== undefined) cat.items[itemIdx].stockQuantity = Number(setObj["items.$.stockQuantity"]);
            return cat;
          }
        }
      }
    }
    return null;
  },
  // Inventory specific helpers
  getAllItemsWithStock: () => {
    const all = [];
    for (const cat of state.menus) {
      for (const item of cat.items) {
        all.push({
          ...item,
          categoryName: cat.name,
          categoryId: cat._id,
          stockQuantity: item.stockQuantity ?? 25,
          lowStockThreshold: item.lowStockThreshold ?? 10,
          isLowStock: (item.stockQuantity ?? 25) <= (item.lowStockThreshold ?? 10) && (item.stockQuantity ?? 25) > 0,
          isOutOfStock: (item.stockQuantity ?? 25) <= 0
        });
      }
    }
    return all;
  },
  updateStock: (itemId, newQuantity) => {
    for (const cat of state.menus) {
      const itm = cat.items.find((i) => String(i._id) === String(itemId));
      if (itm) {
        itm.stockQuantity = Math.max(0, Number(newQuantity));
        return itm;
      }
    }
    return null;
  },
  decrementStock: (items) => {
    for (const reqItem of items) {
      const id = String(reqItem.menuItemId);
      for (const cat of state.menus) {
        const itm = cat.items.find((i) => String(i._id) === id);
        if (itm) {
          itm.stockQuantity = Math.max(0, (itm.stockQuantity ?? 25) - (reqItem.quantity || 1));
        }
      }
    }
  }
};

// Table methods
const tableStore = {
  estimatedDocumentCount: async () => state.tables.length,
  insertMany: async (tables) => {
    state.tables.push(...tables);
    return tables;
  },
  find: () => {
    const formatTables = () =>
      state.tables.map((t) => {
        let currentOrderPopulated = null;
        if (t.currentOrder) {
          const ord = state.orders.find((o) => String(o._id) === String(t.currentOrder));
          if (ord) currentOrderPopulated = { customerDetails: ord.customerDetails, _id: ord._id };
        }
        return {
          ...t,
          currentOrder: currentOrderPopulated
        };
      });
    const promise = Promise.resolve(formatTables());
    promise.populate = () => Promise.resolve(formatTables());
    return promise;
  },
  findOne: async (query) => {
    if (query?.tableNo !== undefined) {
      return state.tables.find((t) => t.tableNo === query.tableNo) || null;
    }
    if (query?._id) {
      return state.tables.find((t) => String(t._id) === String(query._id)) || null;
    }
    return null;
  },
  exists: async (query) => {
    const id = String(query?._id);
    const table = state.tables.find((t) => String(t._id) === id);
    if (!table) return null;
    if (query?.status && table.status !== query.status) return null;
    if (query?.seats?.["$gte"] && table.seats < query.seats["$gte"]) return null;
    return { _id: table._id };
  },
  findByIdAndUpdate: async (id, update) => {
    const idStr = String(id?._id || id);
    const table = state.tables.find((t) => String(t._id) === idStr);
    if (!table) return null;
    if (update["$set"]) Object.assign(table, update["$set"]);
    if (update["$unset"]?.currentOrder) table.currentOrder = null;
    return { ...table };
  },
  findOneAndUpdate: async (filter, update) => {
    const idStr = String(filter?._id);
    const table = state.tables.find((t) => {
      if (idStr && String(t._id) !== idStr) return false;
      if (filter.status && t.status !== filter.status) return false;
      if (filter.seats?.["$gte"] && t.seats < filter.seats["$gte"]) return false;
      return true;
    });
    if (!table) return null;
    if (update["$set"]) Object.assign(table, update["$set"]);
    if (update["$unset"]?.currentOrder) table.currentOrder = null;
    return { ...table };
  }
};

// Order methods
const orderStore = {
  create: async (data) => {
    const newOrder = {
      _id: createId(),
      ...data,
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    state.orders.unshift(newOrder);
    menuStore.decrementStock(newOrder.items || []);
    return newOrder;
  },
  find: () => {
    const getFormatted = () =>
      state.orders.map((o) => {
        const table = state.tables.find((t) => String(t._id) === String(o.table));
        return {
          ...o,
          table: table ? { ...table } : o.table
        };
      });
    const promise = Promise.resolve(getFormatted());
    promise.populate = () => {
      const p = Promise.resolve(getFormatted());
      p.sort = () => Promise.resolve(getFormatted());
      return p;
    };
    promise.sort = () => Promise.resolve(getFormatted());
    return promise;
  },
  findById: (id) => {
    const idStr = String(id?._id || id);
    const order = state.orders.find((o) => String(o._id) === idStr);
    const getOrder = () => {
      if (!order) return null;
      const table = state.tables.find((t) => String(t._id) === String(order.table));
      return {
        ...order,
        table: table ? { ...table } : order.table
      };
    };
    const promise = Promise.resolve(getOrder());
    promise.populate = () => Promise.resolve(getOrder());
    return promise;
  },
  findByIdAndUpdate: async (id, update) => {
    const idStr = String(id?._id || id);
    const order = state.orders.find((o) => String(o._id) === idStr);
    if (!order) return null;
    if (update.orderStatus) order.orderStatus = update.orderStatus;
    if (update["$set"]) Object.assign(order, update["$set"]);
    return { ...order };
  },
  findByIdAndDelete: async (id) => {
    const idStr = String(id?._id || id);
    const idx = state.orders.findIndex((o) => String(o._id) === idStr);
    if (idx !== -1) {
      const [deleted] = state.orders.splice(idx, 1);
      return deleted;
    }
    return null;
  },
  countDocuments: async (query) => {
    if (query?.orderDate?.["$gte"]) {
      const from = query.orderDate["$gte"];
      return state.orders.filter((o) => new Date(o.orderDate) >= from).length;
    }
    return state.orders.length;
  },
  getEnhancedStats: (days = 30) => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const filteredOrders = state.orders.filter((o) => new Date(o.orderDate) >= fromDate);

    let revenue = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    const itemMap = new Map();
    const dailyMap = new Map();
    const categoryMap = new Map();

    // Initialize daily map for last N days (default 7 or 14)
    const pointsCount = Math.min(days, 14);
    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap.set(dateKey, { date: dateKey, label, revenue: 0, orders: 0 });
    }

    for (const order of filteredOrders) {
      const amt = Number(order.bills?.totalWithTax || 0);
      revenue += amt;

      if (order.orderStatus === "In Progress") inProgress++;
      else if (order.orderStatus === "Completed") completed++;
      else if (order.orderStatus === "Cancelled") cancelled++;

      // Daily point
      const orderDateStr = new Date(order.orderDate).toISOString().split("T")[0];
      if (dailyMap.has(orderDateStr)) {
        const point = dailyMap.get(orderDateStr);
        point.revenue += amt;
        point.orders += 1;
      }

      // Items & categories
      for (const itm of order.items || []) {
        const key = itm.name;
        const current = itemMap.get(key) || { _id: itm.menuItemId, name: itm.name, quantity: 0, revenue: 0 };
        current.quantity += itm.quantity || 1;
        current.revenue += Number(itm.price || (itm.pricePerQuantity * itm.quantity) || 0);
        itemMap.set(key, current);
      }
    }

    // Category distribution
    for (const cat of state.menus) {
      let catRevenue = 0;
      let catCount = 0;
      for (const item of cat.items) {
        if (itemMap.has(item.name)) {
          const stats = itemMap.get(item.name);
          catRevenue += stats.revenue;
          catCount += stats.quantity;
        }
      }
      categoryMap.set(cat.name, {
        category: cat.name,
        icon: cat.icon,
        revenue: catRevenue,
        quantity: catCount
      });
    }

    const popularItems = [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
    const dailySales = [...dailyMap.values()];
    const categorySales = [...categoryMap.values()].filter((c) => c.revenue > 0 || c.quantity > 0);

    return {
      orderCount: filteredOrders.length,
      revenue: Math.round(revenue * 100) / 100,
      inProgress,
      completed,
      cancelled,
      popularItems,
      dailySales,
      categorySales
    };
  }
};

// Reservation methods
const reservationStore = {
  getAll: (filter = {}) => {
    let result = [...state.reservations];
    if (filter.status) result = result.filter((r) => r.status === filter.status);
    if (filter.date) result = result.filter((r) => r.reservationDate === filter.date);
    return result.sort((a, b) => new Date(a.reservationDate + "T" + a.timeSlot) - new Date(b.reservationDate + "T" + b.timeSlot));
  },
  create: (data) => {
    const table = state.tables.find((t) => t.tableNo === Number(data.tableNo) || String(t._id) === String(data.tableId));
    const newRes = {
      _id: createId(),
      customerName: data.customerName.trim(),
      phone: String(data.phone).trim(),
      email: data.email?.trim() || "",
      guests: Number(data.guests) || 2,
      reservationDate: data.reservationDate,
      timeSlot: data.timeSlot,
      tableNo: table ? table.tableNo : (Number(data.tableNo) || 1),
      tableId: table ? table._id : (data.tableId || initialTables[0]._id),
      status: "Confirmed",
      notes: data.notes?.trim() || "",
      createdAt: new Date()
    };
    state.reservations.push(newRes);
    return newRes;
  },
  updateStatus: (id, status) => {
    const res = state.reservations.find((r) => String(r._id) === String(id));
    if (res) {
      res.status = status;
      return res;
    }
    return null;
  }
};

// Payment methods
const paymentStore = {
  create: async (data) => {
    const pay = { _id: createId(), ...data, createdAt: new Date() };
    state.payments.push(pay);
    return pay;
  },
  findOne: async (query) => {
    return (
      state.payments.find((p) => {
        if (query.orderId && p.orderId !== query.orderId) return false;
        if (query.paymentId && p.paymentId !== query.paymentId) return false;
        if (query.status && p.status !== query.status) return false;
        return true;
      }) || null
    );
  },
  findOneAndUpdate: async (filter, update) => {
    const pay = state.payments.find((p) => {
      if (filter.orderId && p.orderId !== filter.orderId) return false;
      if (filter._id && String(p._id) !== String(filter._id)) return false;
      return true;
    });
    if (!pay) return null;
    if (update["$set"]) Object.assign(pay, update["$set"]);
    return { ...pay };
  }
};

module.exports = {
  userStore,
  menuStore,
  tableStore,
  orderStore,
  paymentStore,
  reservationStore
};
