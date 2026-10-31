require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.MONGODB_URI || "mongodb+srv://umairsanderwale318_db_user:Umaircs9538%3F@restaurant-pos.dwbgrxd.mongodb.net/Restaurant_pos_db?retryWrites=true&w=majority",
    nodeEnv : process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET || "pos_jwt_secret_dev_key_fallback_8e0b",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    frontendOrigins: (process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    taxRate: Number(process.env.TAX_RATE ?? 5.25),
    initialTableCount: Number(process.env.INITIAL_TABLE_COUNT ?? 15),
    initialTableSeats: Number(process.env.INITIAL_TABLE_SEATS ?? 4)
});

module.exports = config;
