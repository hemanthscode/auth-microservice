/**
 * Email Service
 * 
 * This module provides email sending functionality using Nodemailer.
 * Handles verification emails, password resets, and other notifications.
 * 
 * @module services/emailService
 */

const nodemailer = require('nodemailer');
const { logger } = require('./loggerService');
const { AppError } = require('../utils/errors');

/**
 * Create Email Transporter
 * 
 * Creates and configures the Nodemailer transporter.
 * 
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    return transporter;
  } catch (error) {
    logger.error(`Email transporter creation error: ${error.message}`);
    throw new AppError('Failed to create email transporter', 500);
  }
};

/**
 * Send Email
 * 
 * Generic function to send an email.
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM || 'Auth Service'} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
    
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw new AppError('Failed to send email', 500);
  }
};

/**
 * Send Verification Email
 * 
 * Sends email verification link to user.
 * 
 * @param {string} email - User email address
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Send result
 */
const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    const subject = 'Email Verification - Auth Microservice';
    
    const text = `
      Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you did not create an account, please ignore this email.
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you did not create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Auth Microservice. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendEmail({ to: email, subject, text, html });
    
  } catch (error) {
    logger.error(`Send verification email error: ${error.message}`);
    throw error;
  }
};

/**
 * Send Password Reset Email
 * 
 * Sends password reset link to user.
 * 
 * @param {string} email - User email address
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    
    const subject = 'Password Reset Request - Auth Microservice';
    
    const text = `
      You requested a password reset. Click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you did not request a password reset, please ignore this email and your password will remain unchanged.
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #f44336; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Auth Microservice. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendEmail({ to: email, subject, text, html });
    
  } catch (error) {
    logger.error(`Send password reset email error: ${error.message}`);
    throw error;
  }
};

/**
 * Send Welcome Email
 * 
 * Sends welcome email to newly registered users.
 * 
 * @param {string} email - User email address
 * @param {string} firstName - User's first name
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const subject = 'Welcome to Auth Microservice!';
    
    const text = `
      Hi ${firstName},
      
      Welcome to Auth Microservice! We're excited to have you on board.
      
      Your account has been successfully created and verified.
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The Auth Microservice Team
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome Aboard! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Welcome to Auth Microservice! We're thrilled to have you join our community.</p>
            <p>Your account has been successfully created and verified. You can now enjoy all the features we offer.</p>
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            <p>Best regards,<br>The Auth Microservice Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Auth Microservice. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendEmail({ to: email, subject, text, html });
    
  } catch (error) {
    logger.error(`Send welcome email error: ${error.message}`);
    throw error;
  }
};

/**
 * Send Password Changed Email
 * 
 * Notifies user that their password has been changed.
 * 
 * @param {string} email - User email address
 * @returns {Promise<Object>} Send result
 */
const sendPasswordChangedEmail = async (email) => {
  try {
    const subject = 'Password Changed Successfully';
    
    const text = `
      Your password has been changed successfully.
      
      If you did not make this change, please contact our support team immediately.
      
      Best regards,
      The Auth Microservice Team
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <p>Your password has been changed successfully.</p>
            <div class="alert">
              <strong>🔒 Security Notice:</strong> If you did not make this change, 
              please contact our support team immediately to secure your account.
            </div>
            <p>Best regards,<br>The Auth Microservice Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Auth Microservice. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendEmail({ to: email, subject, text, html });
    
  } catch (error) {
    logger.error(`Send password changed email error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
};
