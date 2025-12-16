const nodemailer = require("nodemailer");
const { logger } = require("./loggerService");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (options) => {
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${options.to} - ${options.subject}`);
    return info;
  } catch (error) {
    logger.error(`Email failed: ${error.message}`);
    throw new Error("Email delivery failed");
  }
};

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const html = `
    <h2>Verify Your Email</h2>
    <p>Click below to verify your email:</p>
    <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
    <p>Or copy this link: ${verificationUrl}</p>
    <p>Link expires in 24 hours.</p>
  `;

  return await sendEmail({
    to: email,
    subject: "Verify Your Email",
    html,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const html = `
    <h2>Password Reset</h2>
    <p>Click below to reset your password:</p>
    <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#dc3545;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
    <p>Or copy this link: ${resetUrl}</p>
    <p>Link expires in 1 hour.</p>
    <p>Ignore if you didn't request this.</p>
  `;

  return await sendEmail({
    to: email,
    subject: "Password Reset",
    html,
  });
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <h2>Welcome ${name}!</h2>
    <p>Thanks for joining us. Your account is now active.</p>
    <p>Explore features and settings in your dashboard.</p>
  `;

  return await sendEmail({
    to: email,
    subject: "Welcome!",
    html,
  });
};

const sendPasswordChangedEmail = async (email) => {
  const html = `
    <h2>Password Changed</h2>
    <p>Your password was changed successfully.</p>
    <p>If you didn't do this, contact support immediately.</p>
  `;

  return await sendEmail({
    to: email,
    subject: "Password Changed",
    html,
  });
};

const sendAccountLockedEmail = async (email, lockUntil) => {
  const html = `
    <h2>Account Locked</h2>
    <p>Your account is locked due to multiple failed login attempts.</p>
    <p>Unlocks at: ${new Date(lockUntil).toLocaleString()}</p>
    <p>Contact support if needed.</p>
  `;

  return await sendEmail({
    to: email,
    subject: "Account Locked",
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
};
