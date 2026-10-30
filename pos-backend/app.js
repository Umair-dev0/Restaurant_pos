const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();


const PORT = config.port;
if (!config.accessTokenSecret) {
    console.error("❌ JWT_SECRET is missing. Create pos-backend/.env and set JWT_SECRET before starting the server.");
    process.exit(1);
}

// Middlewares
app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        const configuredOrigin = config.frontendOrigins.includes(origin);
        const localDevelopmentOrigin = config.nodeEnv !== "production" &&
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
        callback(null, !origin || configuredOrigin || localDevelopmentOrigin);
    }
}))
app.use(express.json({
    verify: (req, res, buffer) => {
        if (req.originalUrl.startsWith("/api/payment/webhook-verification")) {
            req.rawBody = Buffer.from(buffer);
        }
    }
}));
app.use(cookieParser())


// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/menu", require("./routes/menuRoute"));

// Global Error Handler
app.use(globalErrorHandler);


// Server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`☑️  POS Server is listening on port ${PORT}`);
        });
    } catch (error) {
        process.exitCode = 1;
    }
};

if (require.main === module) startServer();

module.exports = app;