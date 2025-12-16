const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === "local";
      },
      minlength: 8,
      select: false,
    },
    avatar: String,
    phoneNumber: {
      type: String,
      match: /^[0-9]{10,15}$/,
    },
    dateOfBirth: Date,
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    oauthProviders: [
      {
        type: String,
        enum: ["google", "github"],
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockUntil: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastLogin: Date,
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isLocked: 1 });

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("isAccountLocked").get(function () {
  return this.isLocked && this.lockUntil && this.lockUntil > Date.now();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    );
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre("save", async function (next) {
  if (!this.role) {
    try {
      const Role = mongoose.model("Role");
      const defaultRole = await Role.findOne({ name: "user" });
      if (defaultRole) this.role = defaultRole._id;
    } catch (error) {}
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpires =
    Date.now() + (parseInt(process.env.EMAIL_VERIFICATION_EXPIRE) || 86400000);
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires =
    Date.now() + (parseInt(process.env.PASSWORD_RESET_EXPIRE) || 3600000);
  return token;
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1, isLocked: false, lockUntil: null },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      isLocked: true,
      lockUntil: Date.now() + 2 * 60 * 60 * 1000,
    };
  }

  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: {
      loginAttempts: 0,
      isLocked: false,
      lockUntil: null,
      lastLogin: Date.now(),
    },
  });
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.loginAttempts;
  delete obj.__v;
  return obj;
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");
  if (!user) return null;

  const isMatch = await user.comparePassword(password);
  return isMatch ? user : null;
};

userSchema.statics.findByEmailVerificationToken = async function (token) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  });
};

userSchema.statics.findByPasswordResetToken = async function (token) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
};

module.exports = mongoose.model("User", userSchema);
