const config = require("../config/config");

const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || (err.code === 11000 ? 409 : err.name === "ValidationError" ? 400 : 500);
    const message = err.code === 11000
        ? "A record with that value already exists."
        : err.name === "ValidationError"
            ? err.message
            : err.message;

    console.error(`${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
    if (config.nodeEnv === "development" && err.stack) {
        console.error(err.stack);
    }

    return res.status(statusCode).json({
        status: statusCode,
        message,
        errorStack: config.nodeEnv === "development" ? err.stack : ""
    })
}

module.exports = globalErrorHandler;