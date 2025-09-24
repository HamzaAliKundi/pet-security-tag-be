import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { 
  verificationEmailTemplate, 
  resetPasswordTemplate, 
  orderConfirmationTemplate, 
  subscriptionNotificationTemplate, 
  qrCodeFirstScanTemplate,
  credentialsEmailTemplate 
} from './emailtemplate';

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

// Send order confirmation email
export const sendOrderConfirmationEmail = async (email: string, orderData: {
  customerName: string;
  orderNumber: string;
  petName: string;
  quantity: number;
  orderDate: string;
  totalAmount: number;
}): Promise<void> => {
  const html = orderConfirmationTemplate(orderData);

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: 'Order Confirmation - Digital Tails',
    html
  };

  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

// Send subscription notification email
export const sendSubscriptionNotificationEmail = async (email: string, subscriptionData: {
  customerName: string;
  action: 'renewal' | 'upgrade';
  planType: string;
  amount: number;
  validUntil: string;
  paymentDate: string;
}): Promise<void> => {
  const html = subscriptionNotificationTemplate(subscriptionData);

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: `Subscription ${subscriptionData.action} Confirmation - Digital Tails`,
    html
  };

  try {
    await sgMail.send(msg);
    console.log('Subscription notification email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending subscription notification email:', error);
    throw error;
  }
};

// Send QR code first scan notification email
export const sendQRCodeFirstScanEmail = async (email: string, scanData: {
  petOwnerName: string;
  petName: string;
  qrCode: string;
  scanDate: string;
  scanLocation: string;
}): Promise<void> => {
  const html = qrCodeFirstScanTemplate(scanData);

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: '🎉 Your Pet\'s QR Code is Now Active! - Digital Tails',
    html
  };

  try {
    await sgMail.send(msg);
    console.log('QR code first scan email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending QR code first scan email:', error);
    throw error;
  }
};

// Send account credentials email
export const sendCredentialsEmail = async (email: string, credentialsData: {
  customerName: string;
  email: string;
  password: string;
  loginUrl: string;
}): Promise<void> => {
  const html = credentialsEmailTemplate(credentialsData);

  const msg = {
    to: email,
    from: {
      email: env.SENDGRID_FROM_EMAIL,
      name: env.SENDGRID_FROM_NAME
    },
    subject: 'Your Account Credentials - Digital Tails',
    html
  };

  try {
    await sgMail.send(msg);
    console.log('Credentials email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending credentials email:', error);
    throw error;
  }
};
