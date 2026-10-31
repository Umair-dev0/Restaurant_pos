const mongoose = require("mongoose");
const { tableStore } = require("../config/inMemoryStore");

const tableSchema = new mongoose.Schema({
    tableNo: { type: Number, required: true, unique: true },
    status: {
        type: String,
        enum: ["Available", "Booked"],
        default: "Available"
    },
    seats: { 
        type: Number,
        required: true,
        min: 1
    },
    currentOrder: {type: mongoose.Schema.Types.ObjectId, ref: "Order"}
});

const RealTableModel = mongoose.model("Table", tableSchema);

function TableWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new RealTableModel(data);
  }
  const item = {
    _id: new mongoose.Types.ObjectId().toString(),
    tableNo: Number(data.tableNo),
    seats: Number(data.seats),
    status: data.status || "Available",
    currentOrder: data.currentOrder || null
  };
  return {
    ...item,
    save: async () => {
      await tableStore.insertMany([item]);
      return item;
    }
  };
}

TableWrapper.find = (query) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.find(query);
  return tableStore.find(query);
};

TableWrapper.findOne = (query) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.findOne(query);
  return tableStore.findOne(query);
};

TableWrapper.findById = (id) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.findById(id);
  return tableStore.findOne({ _id: id });
};

TableWrapper.exists = (query) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.exists(query);
  return tableStore.exists(query);
};

TableWrapper.findByIdAndUpdate = (id, update, options) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.findByIdAndUpdate(id, update, options);
  return tableStore.findByIdAndUpdate(id, update);
};

TableWrapper.findOneAndUpdate = (filter, update, options) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.findOneAndUpdate(filter, update, options);
  return tableStore.findOneAndUpdate(filter, update);
};

TableWrapper.insertMany = (docs) => {
  if (mongoose.connection.readyState === 1) return RealTableModel.insertMany(docs);
  return tableStore.insertMany(docs);
};

TableWrapper.estimatedDocumentCount = () => {
  if (mongoose.connection.readyState === 1) return RealTableModel.estimatedDocumentCount();
  return tableStore.estimatedDocumentCount();
};

module.exports = TableWrapper;