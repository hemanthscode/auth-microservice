const { verifyAccessToken } = require("../config/jwt");
const User = require("../models/User");
const { AppError } = require("../utils/errors");
const { logger } = require("../services/loggerService");

const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError("Authentication required", 401));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const msg = error.message.includes("expired")
        ? "Token expired. Refresh required."
        : "Invalid token";
      return next(new AppError(msg, 401));
    }

    const user = await User.findById(decoded.userId)
      .populate("role")
      .select("-password");

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account deactivated", 403));
    }

    if (user.isAccountLocked) {
      return next(new AppError("Account locked", 403));
    }

    const tokenIssuedAt = new Date(decoded.iat * 1000);
    if (user.lastPasswordChange && user.lastPasswordChange > tokenIssuedAt) {
      return next(new AppError("Password changed. Login again.", 401));
    }

    req.user = user;
    req.userId = user._id;

    if (process.env.NODE_ENV === "development") {
      logger.debug(`Auth: ${user.email}`);
    }

    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    next(new AppError("Authentication failed", 500));
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return next();

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId)
        .populate("role")
        .select("-password");

      if (user && user.isActive && !user.isAccountLocked) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      logger.debug(`Optional auth failed: ${error.message}`);
    }

    next();
  } catch (error) {
    next();
  }
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (!req.user.isEmailVerified) {
    return next(new AppError("Email verification required", 403));
  }
  next();
};

const checkAccountStatus = (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));

  if (!req.user.isActive) {
    return next(new AppError("Account deactivated", 403));
  }

  if (req.user.isAccountLocked) {
    const msg = req.user.lockUntil
      ? `Locked until ${new Date(req.user.lockUntil).toLocaleString()}`
      : "Account locked";
    return next(new AppError(msg, 403));
  }

  next();
};

const attachUser = async (req, res, next) => {
  try {
    if ((req.userId || req.user) && !req.user) {
      const user = await User.findById(req.userId)
        .populate("role")
        .select("-password");
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    logger.error(`Attach user error: ${error.message}`);
    next();
  }
};

const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user._id.toString();
    const now = Date.now();

    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequests.get(userId);

    if (now > userLimit.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return next(new AppError("Rate limit exceeded", 429));
    }

    userLimit.count++;
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireEmailVerification,
  checkAccountStatus,
  attachUser,
  rateLimitByUser,
};
