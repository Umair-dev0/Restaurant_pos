const createHttpError = require("http-errors");

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "Admin") {
    return next(createHttpError(403, "Administrator access is required."));
  }

  next();
};

module.exports = { isAdmin };
