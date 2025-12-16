const winston = require("winston");
const path = require("path");

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
    if (stack) log += `\n${stack}`;
    return log;
  }),
);

const transports = [
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/error.log"),
    level: "error",
    maxsize: 5242880,
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/combined.log"),
    maxsize: 5242880,
    maxFiles: 5,
  }),
];

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat,
      ),
    }),
  );
}

const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

const morganStream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = { logger, morganStream };
