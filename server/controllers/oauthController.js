const passport = require("passport");
const oauthService = require("../services/oauthService");
const { getCookieOptions } = require("../config/jwt");
const { asyncHandler } = require("../middleware/errorHandler");

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

const googleCallback = [
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  asyncHandler(async (req, res) => {
    const result = await oauthService.handleOAuthCallback(
      req.user._json,
      "google",
      {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
      },
    );

    res.cookie("refreshToken", result.refreshToken, getCookieOptions());
    res.redirect(
      `${process.env.CLIENT_URL}${process.env.CLIENT_SUCCESS_REDIRECT}?token=${result.accessToken}`,
    );
  }),
];

const githubAuth = passport.authenticate("github", {
  scope: ["user:email"],
  session: false,
});

const githubCallback = [
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  asyncHandler(async (req, res) => {
    const result = await oauthService.handleOAuthCallback(
      req.user._json,
      "github",
      {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
      },
    );

    res.cookie("refreshToken", result.refreshToken, getCookieOptions());
    res.redirect(
      `${process.env.CLIENT_URL}${process.env.CLIENT_SUCCESS_REDIRECT}?token=${result.accessToken}`,
    );
  }),
];

const getUserProviders = asyncHandler(async (req, res) => {
  const providers = await oauthService.getUserOAuthProviders(req.userId);
  res.status(200).json({ success: true, data: { providers } });
});

const unlinkProvider = asyncHandler(async (req, res) => {
  await oauthService.unlinkOAuthProvider(req.userId, req.params.provider);
  res
    .status(200)
    .json({ success: true, message: `${req.params.provider} unlinked` });
});

module.exports = {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  getUserProviders,
  unlinkProvider,
};
