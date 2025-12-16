const connectDB = require("./db");
const jwtConfig = require("./jwt");
const passport = require("./oauth");

module.exports = { connectDB, jwtConfig, passport };
