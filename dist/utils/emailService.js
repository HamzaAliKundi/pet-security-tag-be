"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
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
