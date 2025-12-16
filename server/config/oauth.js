const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const { logger } = require("../services/loggerService");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { emails, name, photos } = profile;
          const email = emails[0].value;
          const firstName = name.givenName;
          const lastName = name.familyName;
          const avatar = photos[0]?.value;

          let user = await User.findOne({ email });

          if (user) {
            if (!user.oauthProviders.includes("google")) {
              user.oauthProviders.push("google");
              await user.save();
            }
            logger.info(`Google login: ${email}`);
            return done(null, user);
          }

          user = await User.create({
            email,
            firstName,
            lastName,
            avatar,
            isEmailVerified: true,
            oauthProviders: ["google"],
            provider: "google",
          });

          logger.info(`Google signup: ${email}`);
          done(null, user);
        } catch (error) {
          logger.error(`Google OAuth: ${error.message}`);
          done(error, null);
        }
      },
    ),
  );
} else {
  logger.warn("Google OAuth not configured");
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from GitHub"), null);

          const [firstName, ...rest] = (
            profile.displayName || profile.username
          ).split(" ");
          const lastName = rest.join(" ") || "";
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ email });

          if (user) {
            if (!user.oauthProviders.includes("github")) {
              user.oauthProviders.push("github");
              await user.save();
            }
            logger.info(`GitHub login: ${email}`);
            return done(null, user);
          }

          user = await User.create({
            email,
            firstName,
            lastName,
            avatar,
            isEmailVerified: true,
            oauthProviders: ["github"],
            provider: "github",
          });

          logger.info(`GitHub signup: ${email}`);
          done(null, user);
        } catch (error) {
          logger.error(`GitHub OAuth: ${error.message}`);
          done(error, null);
        }
      },
    ),
  );
} else {
  logger.warn("GitHub OAuth not configured");
}

module.exports = passport;
