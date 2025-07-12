"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const emailtemplate_1 = require("./emailtemplate");
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    port: 587,
    secure: false,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});
const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${env_1.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = (0, emailtemplate_1.verificationEmailTemplate)({ name, verificationUrl });
    await transporter.sendMail({
        from: `"Pet security" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email',
        html
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${env_1.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = (0, emailtemplate_1.resetPasswordTemplate)({ name, resetUrl });
    await transporter.sendMail({
        from: `"Pet security" <${env_1.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
