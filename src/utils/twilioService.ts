import twilio from 'twilio';
import { env } from '../config/env';

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
    let errorMessage = 'Unknown error occurred';
    
    // Check for Twilio error code 21612 (geographic permissions)
    if (error.code === 21612) {
      errorMessage = `Cannot send SMS to ${params.phoneNumber}. Your Twilio number (${env.TWILIO_PHONE_NUMBER}) doesn't have permission to send to this country. Enable geographic permissions at: https://console.twilio.com/us1/develop/sms/settings/geo-permissions`;
    } else if (error instanceof Error) {
      if (error.message.includes('Invalid phone number')) {
        errorMessage = 'Invalid phone number format';
      } else if (error.message.includes('Permission denied') || error.message.includes('cannot be sent')) {
        errorMessage = 'SMS service not available. Please enable geographic permissions for this country in your Twilio Console: https://console.twilio.com/us1/develop/sms/settings/geo-permissions';
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
