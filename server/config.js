// Load environment variables from .env file
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY ,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_FILE: process.env.LOG_FILE || "logs/app.log",
};
