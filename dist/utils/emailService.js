"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCredentialsEmail = exports.sendQRCodeFirstScanEmail = exports.sendSubscriptionNotificationEmail = exports.sendOrderConfirmationEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const env_1 = require("../config/env");
const emailtemplate_1 = require("./emailtemplate");
// Configure SendGrid with API key
mail_1.default.setApiKey(env_1.env.SENDGRID_API_KEY);
const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${env_1.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = (0, emailtemplate_1.verificationEmailTemplate)({ name, verificationUrl });
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: 'Verify Your Email',
        html
    };
    try {
        await mail_1.default.send(msg);
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${env_1.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = (0, emailtemplate_1.resetPasswordTemplate)({ name, resetUrl });
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: 'Reset Your Password',
        html
    };
    try {
        await mail_1.default.send(msg);
    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderData) => {
    const html = (0, emailtemplate_1.orderConfirmationTemplate)(orderData);
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: 'Order Confirmation - Digital Tails',
        html
    };
    try {
        await mail_1.default.send(msg);
        console.log('Order confirmation email sent successfully to:', email);
    }
    catch (error) {
        console.error('Error sending order confirmation email:', error);
        throw error;
    }
};
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
// Send subscription notification email
const sendSubscriptionNotificationEmail = async (email, subscriptionData) => {
    const html = (0, emailtemplate_1.subscriptionNotificationTemplate)(subscriptionData);
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: `Subscription ${subscriptionData.action} Confirmation - Digital Tails`,
        html
    };
    try {
        await mail_1.default.send(msg);
        console.log('Subscription notification email sent successfully to:', email);
    }
    catch (error) {
        console.error('Error sending subscription notification email:', error);
        throw error;
    }
};
exports.sendSubscriptionNotificationEmail = sendSubscriptionNotificationEmail;
// Send QR code first scan notification email
const sendQRCodeFirstScanEmail = async (email, scanData) => {
    const html = (0, emailtemplate_1.qrCodeFirstScanTemplate)(scanData);
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: '🎉 Your Pet\'s QR Code is Now Active! - Digital Tails',
        html
    };
    try {
        await mail_1.default.send(msg);
        console.log('QR code first scan email sent successfully to:', email);
    }
    catch (error) {
        console.error('Error sending QR code first scan email:', error);
        throw error;
    }
};
exports.sendQRCodeFirstScanEmail = sendQRCodeFirstScanEmail;
// Send account credentials email
const sendCredentialsEmail = async (email, credentialsData) => {
    const html = (0, emailtemplate_1.credentialsEmailTemplate)(credentialsData);
    const msg = {
        to: email,
        from: {
            email: env_1.env.SENDGRID_FROM_EMAIL,
            name: env_1.env.SENDGRID_FROM_NAME
        },
        subject: 'Your Account Credentials - Digital Tails',
        html
    };
    try {
        await mail_1.default.send(msg);
        console.log('Credentials email sent successfully to:', email);
    }
    catch (error) {
        console.error('Error sending credentials email:', error);
        throw error;
    }
};
exports.sendCredentialsEmail = sendCredentialsEmail;
