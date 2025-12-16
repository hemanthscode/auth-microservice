const rateLimit = require("express-rate-limit");
const { logger } = require("../services/loggerService");

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests, try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit: ${req.ip}`);
    res.status(429).json({ success: false, error: "Too many requests" });
  },
  skip: (req) => req.user?.role?.name === "superadmin",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many auth attempts",
  handler: (req, res) => {
    logger.warn(`Auth limit: ${req.ip}`);
    res
      .status(429)
      .json({
        success: false,
        error: "Too many auth attempts. Try in 15 min.",
      });
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many reset requests",
  handler: (req, res) => {
    logger.warn(`Reset limit: ${req.ip}`);
    res
      .status(429)
      .json({
        success: false,
        error: "Too many reset requests. Try in 1 hour.",
      });
  },
});

const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many verification requests",
  handler: (req, res) => {
    logger.warn(`Verification limit: ${req.ip}`);
    res
      .status(429)
      .json({
        success: false,
        error: "Too many verification requests. Try in 1 hour.",
      });
  },
});

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many account creations",
  handler: (req, res) => {
    logger.warn(`Account limit: ${req.ip}`);
    res
      .status(429)
      .json({
        success: false,
        error: "Too many account creations. Try in 1 hour.",
      });
  },
});

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests",
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit: ${req.ip}, Route: ${req.originalUrl}`);
      res.status(429).json({ success: false, error: message });
    },
  });
};

const dynamicRateLimiterByRole = (limits = {}) => {
  const defaultLimits = {
    superadmin: Infinity,
    admin: 1000,
    moderator: 500,
    user: 100,
    guest: 50,
    ...limits,
  };

  const requestCounts = new Map();
  const windowMs = 15 * 60 * 1000;

  return (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const roleName = req.user?.role?.name || "guest";
    const maxRequests = defaultLimits[roleName] || defaultLimits.guest;

    if (maxRequests === Infinity) return next();

    const now = Date.now();

    if (!requestCounts.has(identifier)) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = requestCounts.get(identifier);

    if (now > userLimit.resetTime) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      logger.warn(`Role rate limit: ${roleName}, ${identifier}`);
      return res
        .status(429)
        .json({ success: false, error: "Too many requests" });
    }

    userLimit.count++;
    next();
  };
};

module.exports = apiLimiter;
module.exports.authLimiter = authLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
module.exports.emailVerificationLimiter = emailVerificationLimiter;
module.exports.createAccountLimiter = createAccountLimiter;
module.exports.createRateLimiter = createRateLimiter;
module.exports.dynamicRateLimiterByRole = dynamicRateLimiterByRole;
