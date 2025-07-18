import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { verificationEmailTemplate, resetPasswordTemplate } from './emailtemplate';

// Configure SendGrid with API key
sgMail.setApiKey(env.SENDGRID_API_KEY);

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = verificationEmailTemplate({ name, verificationUrl });

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: 'Verify Your Email',
    html
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = resetPasswordTemplate({ name, resetUrl });

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: 'Reset Your Password',
    html
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
