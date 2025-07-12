import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { verificationEmailTemplate, resetPasswordTemplate } from './emailtemplate';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false 
  }
});

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = verificationEmailTemplate({ name, verificationUrl });

  await transporter.sendMail({
    from: `"Pet security" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email',
    html
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = resetPasswordTemplate({ name, resetUrl });

  await transporter.sendMail({
    from: `"Pet security" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html
  });
};
