import twilio from 'twilio';
import { env } from '../config/env';

// Validate Twilio credentials before initializing
if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
  console.error('⚠️  WARNING: Twilio credentials are missing! SMS/WhatsApp functionality will not work.');
  console.error('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
}

// Initialize Twilio client
const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

/**
 * Detects the country code from a phone number
 * @param phoneNumber - Phone number in E.164 format (e.g., +447928239287)
 * @returns Country code (e.g., '44' for UK, '1' for US) or null if not detected
 */
const detectCountryCode = (phoneNumber: string): string | null => {
  // Remove any spaces, dashes, or parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  console.log(`   🔍 Country code detection - Original: ${phoneNumber}, Cleaned: ${cleaned}`);
  
  // Must start with +
  if (!cleaned.startsWith('+')) {
    console.log(`   ❌ Phone number does not start with +`);
    return null;
  }
  
  // Check for common 2-digit country codes first (to avoid matching partial 3-digit codes)
  // UK (44) - check this first since it's our priority
  if (cleaned.startsWith('+44')) {
    console.log(`   ✅ Detected country code: 44 (UK)`);
    return '44';
  }
  
  // US/Canada (1)
  if (cleaned.startsWith('+1')) {
    console.log(`   ✅ Detected country code: 1 (US/Canada)`);
    return '1';
  }
  
  // Other common 2-digit country codes
  const twoDigitCodes = ['33', '49', '39', '34', '61', '27', '55', '52', '86', '81', '91', '92'];
  for (const code of twoDigitCodes) {
    if (cleaned.startsWith(`+${code}`)) {
      console.log(`   ✅ Detected country code: ${code} (2-digit)`);
      return code;
    }
  }
  
  // Check for 1-digit country codes (like +7 for Russia)
  if (cleaned.match(/^\+7\d/)) {
    console.log(`   ✅ Detected country code: 7 (Russia/Kazakhstan)`);
    return '7';
  }
  
  // Fallback: Extract first 1-3 digits (but this is less reliable)
  // Try 2 digits first, then 1, then 3
  for (const len of [2, 1, 3]) {
    const match = cleaned.match(new RegExp(`^\\+(\\d{${len}})`));
    if (match) {
      const countryCode = match[1];
      console.log(`   ✅ Detected country code: ${countryCode} (fallback, length: ${len})`);
      return countryCode;
    }
  }
  
  console.log(`   ❌ Could not extract country code from: ${cleaned}`);
  return null;
};

/**
 * Canadian area codes list (NANP - North American Numbering Plan)
 * These are the area codes used in Canada (country code +1)
 * Complete list verified from user-provided data
 */
const CANADIAN_AREA_CODES = [
  '204', // Manitoba
  '226', // Ontario
  '236', // British Columbia
  '249', // Ontario
  '250', // British Columbia
  '289', // Ontario
  '306', // Saskatchewan
  '343', // Ontario
  '365', // Ontario
  '403', // Alberta
  '416', // Ontario
  '418', // Quebec
  '431', // Manitoba
  '437', // Ontario
  '438', // Quebec
  '450', // Quebec
  '506', // New Brunswick
  '514', // Quebec
  '519', // Ontario
  '548', // Ontario
  '579', // Quebec
  '581', // Quebec
  '587', // Alberta
  '604', // British Columbia
  '613', // Ontario
  '639', // Saskatchewan
  '647', // Ontario
  '672', // British Columbia
  '705', // Ontario
  '709', // Newfoundland and Labrador
  '742', // Ontario
  '753', // Ontario
  '778', // British Columbia
  '780', // Alberta
  '782', // Nova Scotia
  '807', // Ontario
  '819', // Quebec
  '825', // Alberta
  '867', // Northwest Territories, Nunavut, Yukon
  '873', // Quebec
  '902', // Prince Edward Island, Nova Scotia
  '905'  // Ontario
];

/**
 * Detects if a +1 phone number is from Canada based on area code
 * @param phoneNumber - Phone number in E.164 format (e.g., +16132654168)
 * @returns true if Canadian, false if US or unknown
 */
const isCanadianNumber = (phoneNumber: string): boolean => {
  // Remove any spaces, dashes, or parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Must start with +1
  if (!cleaned.startsWith('+1')) {
    return false;
  }
  
  // Extract area code (next 3 digits after +1)
  if (cleaned.length < 5) {
    return false; // Not enough digits
  }
  
  const areaCode = cleaned.substring(2, 5); // Extract 3 digits after +1
  
  // Check if area code is in Canadian list
  const isCanadian = CANADIAN_AREA_CODES.includes(areaCode);
  
  console.log(`   🔍 Area code detection: ${areaCode} → ${isCanadian ? 'Canada' : 'USA'}`);
  
  return isCanadian;
};

/**
 * Gets the appropriate Twilio phone number based on recipient's country code
 * @param recipientPhoneNumber - Recipient's phone number
 * @returns Appropriate sender phone number
 */
const getSenderPhoneNumber = (recipientPhoneNumber: string): string => {
  const countryCode = detectCountryCode(recipientPhoneNumber);
  
  console.log(`🔍 Detecting sender number for: ${recipientPhoneNumber}`);
  console.log(`   Detected country code: ${countryCode || 'unknown'}`);
  
  // UK numbers (country code 44)
  if (countryCode === '44') {
    console.log(`   UK number available: ${env.TWILIO_PHONE_NUMBER_UK ? 'YES' : 'NO'}`);
    console.log(`   UK number value: ${env.TWILIO_PHONE_NUMBER_UK || 'NOT SET'}`);
    const selectedNumber = env.TWILIO_PHONE_NUMBER_UK || env.TWILIO_PHONE_NUMBER;
    console.log(`   ✅ Selected UK number: ${selectedNumber}`);
    if (!env.TWILIO_PHONE_NUMBER_UK) {
      console.warn(`   ⚠️  WARNING: TWILIO_PHONE_NUMBER_UK not set in .env! Falling back to US number.`);
    }
    return selectedNumber;
  }
  
  // US/Canada numbers (country code 1) - need to differentiate
  if (countryCode === '1') {
    const isCanadian = isCanadianNumber(recipientPhoneNumber);
    
    if (isCanadian) {
      // Check if Canadian number is configured
      const canadianNumber = env.TWILIO_PHONE_NUMBER_CA || env.TWILIO_PHONE_NUMBER;
      console.log(`   Canadian number available: ${env.TWILIO_PHONE_NUMBER_CA ? 'YES' : 'NO'}`);
      console.log(`   Canadian number value: ${env.TWILIO_PHONE_NUMBER_CA || 'NOT SET'}`);
      console.log(`   ✅ Selected Canadian number: ${canadianNumber}`);
      if (!env.TWILIO_PHONE_NUMBER_CA) {
        console.warn(`   ⚠️  WARNING: TWILIO_PHONE_NUMBER_CA not set in .env! Falling back to US number.`);
      }
      return canadianNumber;
    } else {
      // US number
      console.log(`   ✅ Selected US number: ${env.TWILIO_PHONE_NUMBER}`);
      return env.TWILIO_PHONE_NUMBER;
    }
  }
  
  // Default to US number for all other countries
  console.log(`   ✅ Selected US/default number: ${env.TWILIO_PHONE_NUMBER}`);
  return env.TWILIO_PHONE_NUMBER;
};

/**
 * Gets the appropriate Twilio WhatsApp number based on recipient's country code
 * @param recipientPhoneNumber - Recipient's phone number
 * @returns Appropriate sender WhatsApp number
 */
const getSenderWhatsAppNumber = (recipientPhoneNumber: string): string => {
  const countryCode = detectCountryCode(recipientPhoneNumber);
  
  console.log(`🔍 Detecting sender WhatsApp number for: ${recipientPhoneNumber}`);
  console.log(`   Detected country code: ${countryCode || 'unknown'}`);
  
  // UK numbers (country code 44)
  if (countryCode === '44') {
    console.log(`   UK WhatsApp number available: ${env.TWILIO_WHATSAPP_NUMBER_UK ? 'YES' : 'NO'}`);
    console.log(`   UK WhatsApp number value: ${env.TWILIO_WHATSAPP_NUMBER_UK || 'NOT SET'}`);
    const selectedNumber = env.TWILIO_WHATSAPP_NUMBER_UK || env.TWILIO_WHATSAPP_NUMBER;
    console.log(`   ✅ Selected UK WhatsApp number: ${selectedNumber}`);
    if (!env.TWILIO_WHATSAPP_NUMBER_UK) {
      console.warn(`   ⚠️  WARNING: TWILIO_WHATSAPP_NUMBER_UK not set in .env! Falling back to US number.`);
    }
    return selectedNumber;
  }
  
  // US/Canada numbers (country code 1) - need to differentiate
  if (countryCode === '1') {
    const isCanadian = isCanadianNumber(recipientPhoneNumber);
    
    if (isCanadian) {
      // Check if Canadian WhatsApp number is configured
      const canadianWhatsAppNumber = env.TWILIO_WHATSAPP_NUMBER_CA || env.TWILIO_WHATSAPP_NUMBER;
      console.log(`   Canadian WhatsApp number available: ${env.TWILIO_WHATSAPP_NUMBER_CA ? 'YES' : 'NO'}`);
      console.log(`   Canadian WhatsApp number value: ${env.TWILIO_WHATSAPP_NUMBER_CA || 'NOT SET'}`);
      console.log(`   ✅ Selected Canadian WhatsApp number: ${canadianWhatsAppNumber}`);
      if (!env.TWILIO_WHATSAPP_NUMBER_CA) {
        console.warn(`   ⚠️  WARNING: TWILIO_WHATSAPP_NUMBER_CA not set in .env! Falling back to US number.`);
      }
      return canadianWhatsAppNumber;
    } else {
      // US WhatsApp number
      console.log(`   ✅ Selected US WhatsApp number: ${env.TWILIO_WHATSAPP_NUMBER}`);
      return env.TWILIO_WHATSAPP_NUMBER;
    }
  }
  
  // Default to US number for all other countries
  console.log(`   ✅ Selected US/default WhatsApp number: ${env.TWILIO_WHATSAPP_NUMBER}`);
  return env.TWILIO_WHATSAPP_NUMBER;
};

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

    // Get appropriate sender number based on recipient's country code
    const senderNumber = getSenderPhoneNumber(params.phoneNumber);
    const countryCode = detectCountryCode(params.phoneNumber);
    console.log(`📞 Using sender number: ${senderNumber} (detected country code: ${countryCode || 'unknown'})`);

    const result = await client.messages.create({
      body: message,
      from: senderNumber,
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
    
    // Get sender number for error messages
    const senderNumber = getSenderPhoneNumber(params.phoneNumber);
    let errorMessage = 'Unknown error occurred';
    
    // Check for Twilio authentication errors
    if (error?.status === 401 || error?.code === 20003 || error?.message?.includes('Authenticate') || error?.message?.includes('authentication')) {
      errorMessage = 'Twilio authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.';
    } 
    // Check for Twilio error code 21612 (geographic permissions)
    else if (error.code === 21612) {
      errorMessage = `Cannot send SMS to ${params.phoneNumber}. Your Twilio number (${senderNumber}) doesn't have permission to send to this country. Enable geographic permissions at: https://console.twilio.com/us1/develop/sms/settings/geo-permissions`;
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

    // Get appropriate sender WhatsApp number based on recipient's country code
    const senderWhatsAppNumber = getSenderWhatsAppNumber(params.phoneNumber);
    console.log(`💬 Using sender WhatsApp number: ${senderWhatsAppNumber} (detected country code: ${detectCountryCode(params.phoneNumber) || 'unknown'})`);

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${senderWhatsAppNumber}`,
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
