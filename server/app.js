const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const { errorHandler } = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const roleRoutes = require("./routes/roleRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

require("./config/oauth");

const { morganStream } = require("./services/loggerService");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined", { stream: morganStream }));
}

app.use(passport.initialize());
app.use("/api/", rateLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server healthy",
    timestamp: new Date().toISOString(),
  });
});

const API_VERSION = process.env.API_VERSION || "v1";

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/oauth`, oauthRoutes);
app.use(`/api/${API_VERSION}/roles`, roleRoutes);
app.use(`/api/${API_VERSION}/password`, passwordRoutes);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorHandler);

module.exports = app;
