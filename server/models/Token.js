const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      enum: ["refresh", "access"],
      default: "refresh",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: Date,
    revokedReason: String,
    ipAddress: String,
    userAgent: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

tokenSchema.index({ user: 1 });
tokenSchema.index({ token: 1 }, { unique: true });
tokenSchema.index({ isRevoked: 1 });
tokenSchema.index({ user: 1, isRevoked: 1, expiresAt: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

tokenSchema.methods.isExpired = function () {
  return this.expiresAt < Date.now();
};

tokenSchema.methods.isValid = function () {
  return !this.isExpired() && !this.isRevoked;
};

tokenSchema.methods.revokeToken = async function (
  reason = "Manual revocation",
) {
  this.isRevoked = true;
  this.revokedAt = Date.now();
  this.revokedReason = reason;
  return await this.save();
};

tokenSchema.methods.updateLastUsed = async function () {
  this.lastUsedAt = Date.now();
  return await this.save();
};

tokenSchema.statics.findActiveToken = async function (token) {
  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: Date.now() },
  }).populate("user");
};

tokenSchema.statics.findUserTokens = async function (
  userId,
  activeOnly = true,
) {
  const query = { user: userId };
  if (activeOnly) {
    query.isRevoked = false;
    query.expiresAt = { $gt: Date.now() };
  }
  return await this.find(query).sort({ createdAt: -1 });
};

tokenSchema.statics.revokeUserTokens = async function (
  userId,
  reason = "User logout",
) {
  return await this.updateMany(
    { user: userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: Date.now(),
        revokedReason: reason,
      },
    },
  );
};

tokenSchema.statics.cleanExpiredTokens = async function () {
  return await this.deleteMany({ expiresAt: { $lt: Date.now() } });
};

tokenSchema.statics.cleanRevokedTokens = async function () {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return await this.deleteMany({
    isRevoked: true,
    revokedAt: { $lt: thirtyDaysAgo },
  });
};

tokenSchema.statics.getTokenStatistics = async function () {
  const [total, active, expired, revoked] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isRevoked: false, expiresAt: { $gt: Date.now() } }),
    this.countDocuments({ expiresAt: { $lt: Date.now() } }),
    this.countDocuments({ isRevoked: true }),
  ]);

  return { total, active, expired, revoked };
};

module.exports = mongoose.model("Token", tokenSchema);
