const mongoose = require("mongoose");
const config = require("./config");
const Menu = require("../models/menuModel");
const Table = require("../models/tableModel");
const defaultMenu = require("./defaultMenu.json");

const connectDB = async () => {
    try {
        mongoose.set('bufferCommands', false); // Fail fast, don't hang
        const conn = await mongoose.connect(config.databaseURI, {
            serverSelectionTimeoutMS: 2000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        const categoryCount = await Menu.estimatedDocumentCount();
        if (categoryCount === 0) {
            await Menu.insertMany(defaultMenu);
            console.log("✅ Initial menu catalog created.");
        }
        const tableCount = await Table.estimatedDocumentCount();
        if (tableCount === 0 && config.initialTableCount > 0 && config.initialTableSeats > 0) {
            await Table.insertMany(
                Array.from({ length: config.initialTableCount }, (_, index) => ({
                    tableNo: index + 1,
                    seats: config.initialTableSeats
                }))
            );
            console.log("✅ Initial tables created.");
        }
    } catch (error) {
        console.warn(`[AI Studio] MongoDB not connected (${error.message}) — running with in-memory store`);
    }
}

module.exports = connectDB;