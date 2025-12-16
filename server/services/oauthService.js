const User = require("../models/User");
const OAuthProvider = require("../models/OAuthProvider");
const Token = require("../models/Token");
const { generateAccessToken, generateRefreshToken } = require("../config/jwt");
const { AppError } = require("../utils/errors");
const { logger } = require("./loggerService");

const handleOAuthCallback = async (profile, provider, tokens) => {
  const { email } = profile;

  if (!email) throw new AppError("Email not provided by OAuth", 400);

  let user = await User.findOne({ email: email.toLowerCase() }).populate(
    "role",
  );

  if (user) {
    if (!user.oauthProviders.includes(provider)) {
      user.oauthProviders.push(provider);
      await user.save();
    }
  } else {
    const Role = require("../models/Role");
    const defaultRole = await Role.findOne({ name: "user" });

    const names = profile.displayName?.split(" ") ||
      profile.name?.split(" ") || ["User"];
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "";

    user = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      avatar: profile.avatar_url || profile.picture,
      isEmailVerified: true,
      provider,
      oauthProviders: [provider],
      role: defaultRole._id,
    });

    user = await User.findById(user._id).populate("role");
  }

  await OAuthProvider.linkProvider(user._id, {
    provider,
    providerId: profile.id || profile.sub,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    profile: {
      email,
      displayName: profile.displayName || profile.name,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: profile.avatar_url || profile.picture,
      profileUrl: profile.html_url || profile.link,
    },
  });

  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });

  await Token.create({
    user: user._id,
    token: refreshToken,
    tokenType: "refresh",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  logger.info(`OAuth login: ${provider} - ${user.email}`);
  return { user: user.toSafeObject(), accessToken, refreshToken };
};

const getUserOAuthProviders = async (userId) => {
  return await OAuthProvider.findUserProviders(userId);
};

const unlinkOAuthProvider = async (userId, provider) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.provider === provider && !user.password) {
    throw new AppError("Cannot unlink primary provider without password", 400);
  }

  await OAuthProvider.unlinkProvider(userId, provider);

  user.oauthProviders = user.oauthProviders.filter((p) => p !== provider);
  await user.save();

  logger.info(`OAuth unlinked: ${provider} - ${user.email}`);
};

module.exports = {
  handleOAuthCallback,
  getUserOAuthProviders,
  unlinkOAuthProvider,
};
