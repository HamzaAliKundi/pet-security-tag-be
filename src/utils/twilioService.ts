import twilio from 'twilio';
import { env } from '../config/env';

// Validate Twilio credentials before initializing
if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
  console.error('⚠️  WARNING: Twilio credentials are missing! SMS/WhatsApp functionality will not work.');
  console.error('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
}

// Initialize Twilio client
const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export interface LocationShareParams {
  petId: string;
  method: 'sms' | 'whatsapp';
  latitude: number;
  longitude: number;
  locationUrl: string;
  petName: string;
  phoneNumber: string;
  ownerName: string;
}

export const sendLocationViaSMS = async (params: LocationShareParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    let message;
    
    if (params.latitude && params.longitude) {
      // GPS location
      message = `🐾 Pet Found Alert!\n\n${params.petName} has been found!\n\n📍 GPS Location: ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
    } else {
      // Manual location
      message = `🐾 Pet Found Alert!\n\n${params.petName} has been found!\n\n📍 Location: ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
    }

    console.log(`📱 Sending SMS to: ${params.phoneNumber}`);

    const result = await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: params.phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    console.error('Twilio error details:', {
      code: error?.code,
      message: error?.message,
      status: error?.status,
      moreInfo: error?.moreInfo
    });
    
    let errorMessage = 'Unknown error occurred';
    
    // Check for Twilio authentication errors
    if (error?.status === 401 || error?.code === 20003 || error?.message?.includes('Authenticate') || error?.message?.includes('authentication')) {
      errorMessage = 'Twilio authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.';
    } 
    // Check for Twilio error code 21612 (geographic permissions)
    else if (error.code === 21612) {
      errorMessage = `Cannot send SMS to ${params.phoneNumber}. Your Twilio number (${env.TWILIO_PHONE_NUMBER}) doesn't have permission to send to this country. Enable geographic permissions at: https://console.twilio.com/us1/develop/sms/settings/geo-permissions`;
    } 
    // Check for invalid credentials
    else if (error?.code === 20003 || error?.code === 20403) {
      errorMessage = 'Twilio credentials are invalid or account is suspended. Please verify your Twilio account credentials.';
    }
    // Check for trial account limitations
    else if (error?.code === 21211 || error?.message?.includes('trial')) {
      errorMessage = 'Twilio trial account limitation. Please verify the recipient number in your Twilio Console or upgrade your account.';
    }
    else if (error instanceof Error) {
      if (error.message.includes('Invalid phone number')) {
        errorMessage = 'Invalid phone number format';
      } else if (error.message.includes('Permission denied') || error.message.includes('cannot be sent')) {
        errorMessage = 'SMS service not available. Please enable geographic permissions for this country in your Twilio Console: https://console.twilio.com/us1/develop/sms/settings/geo-permissions';
      } else {
        errorMessage = error.message || 'Unknown Twilio error occurred';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const sendLocationViaWhatsApp = async (params: LocationShareParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    let message;
    
    if (params.latitude && params.longitude) {
      // GPS location
      message = `🐾 *Pet Found Alert!*\n\n*${params.petName}* has been found!\n\n📍 *GPS Location:* ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
    } else {
      // Manual location
      message = `🐾 *Pet Found Alert!*\n\n*${params.petName}* has been found!\n\n📍 *Location:* ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
    }

    console.log(`💬 Sending WhatsApp to: ${params.phoneNumber}`);

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${params.phoneNumber}`
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid phone number')) {
        errorMessage = 'Invalid WhatsApp number format';
      } else if (error.message.includes('Permission denied') || error.message.includes('cannot be sent')) {
        errorMessage = 'WhatsApp service not available. Please verify the destination number in your Twilio account.';
      } else if (error.message.includes('not a WhatsApp number')) {
        errorMessage = 'This number is not registered with WhatsApp';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const sendLocationNotification = async (params: LocationShareParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  if (params.method === 'sms') {
    return await sendLocationViaSMS(params);
  } else if (params.method === 'whatsapp') {
    return await sendLocationViaWhatsApp(params);
  } else {
    return {
      success: false,
      error: 'Invalid method. Must be "sms" or "whatsapp"'
    };
  }
};
