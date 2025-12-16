const mongoose = require("mongoose");

const oauthProviderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["google", "github"],
      lowercase: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiry: Date,
    profile: {
      email: String,
      displayName: String,
      firstName: String,
      lastName: String,
      avatar: String,
      profileUrl: String,
    },
    scope: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSync: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

oauthProviderSchema.index({ user: 1 });
oauthProviderSchema.index({ user: 1, provider: 1 }, { unique: true });
oauthProviderSchema.index({ provider: 1, providerId: 1 });

oauthProviderSchema.methods.isTokenExpired = function () {
  return this.tokenExpiry ? this.tokenExpiry < Date.now() : false;
};

oauthProviderSchema.methods.updateTokens = async function (
  accessToken,
  refreshToken,
  expiresIn,
) {
  this.accessToken = accessToken;
  if (refreshToken) this.refreshToken = refreshToken;
  if (expiresIn) this.tokenExpiry = Date.now() + expiresIn * 1000;
  this.lastSync = Date.now();
  return await this.save();
};

oauthProviderSchema.methods.updateProfile = async function (profileData) {
  this.profile = { ...this.profile, ...profileData };
  this.lastSync = Date.now();
  return await this.save();
};

oauthProviderSchema.methods.deactivate = async function () {
  this.isActive = false;
  return await this.save();
};

oauthProviderSchema.statics.findByProvider = async function (
  provider,
  providerId,
) {
  return await this.findOne({
    provider: provider.toLowerCase(),
    providerId,
    isActive: true,
  }).populate("user");
};

oauthProviderSchema.statics.findUserProviders = async function (
  userId,
  activeOnly = true,
) {
  const query = { user: userId };
  if (activeOnly) query.isActive = true;
  return await this.find(query).sort({ createdAt: -1 });
};

oauthProviderSchema.statics.linkProvider = async function (
  userId,
  providerData,
) {
  const {
    provider,
    providerId,
    accessToken,
    refreshToken,
    expiresIn,
    profile,
    scope,
  } = providerData;

  let oauthProvider = await this.findOne({ user: userId, provider });

  if (oauthProvider) {
    Object.assign(oauthProvider, {
      providerId,
      accessToken,
      refreshToken: refreshToken || oauthProvider.refreshToken,
      tokenExpiry: expiresIn ? Date.now() + expiresIn * 1000 : null,
      profile,
      scope: scope || oauthProvider.scope,
      isActive: true,
      lastSync: Date.now(),
    });
    return await oauthProvider.save();
  }

  return await this.create({
    user: userId,
    provider,
    providerId,
    accessToken,
    refreshToken,
    tokenExpiry: expiresIn ? Date.now() + expiresIn * 1000 : null,
    profile,
    scope,
  });
};

oauthProviderSchema.statics.unlinkProvider = async function (userId, provider) {
  return await this.deleteOne({
    user: userId,
    provider: provider.toLowerCase(),
  });
};

module.exports = mongoose.model("OAuthProvider", oauthProviderSchema);
