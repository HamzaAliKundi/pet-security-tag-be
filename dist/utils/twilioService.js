"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLocationNotification = exports.sendLocationViaWhatsApp = exports.sendLocationViaSMS = void 0;
const twilio_1 = __importDefault(require("twilio"));
const env_1 = require("../config/env");
// Validate Twilio credentials before initializing
if (!env_1.env.TWILIO_ACCOUNT_SID || !env_1.env.TWILIO_AUTH_TOKEN) {
    console.error('⚠️  WARNING: Twilio credentials are missing! SMS/WhatsApp functionality will not work.');
    console.error('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
}
// Initialize Twilio client
const client = (0, twilio_1.default)(env_1.env.TWILIO_ACCOUNT_SID, env_1.env.TWILIO_AUTH_TOKEN);
const sendLocationViaSMS = async (params) => {
    var _a, _b, _c;
    try {
        let message;
        if (params.latitude && params.longitude) {
            // GPS location
            message = `🐾 Pet Found Alert!\n\n${params.petName} has been found!\n\n📍 GPS Location: ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
        }
        else {
            // Manual location
            message = `🐾 Pet Found Alert!\n\n${params.petName} has been found!\n\n📍 Location: ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
        }
        console.log(`📱 Sending SMS to: ${params.phoneNumber}`);
        const result = await client.messages.create({
            body: message,
            from: env_1.env.TWILIO_PHONE_NUMBER,
            to: params.phoneNumber
        });
        return {
            success: true,
            messageId: result.sid
        };
    }
    catch (error) {
        console.error('Error sending SMS:', error);
        console.error('Twilio error details:', {
            code: error === null || error === void 0 ? void 0 : error.code,
            message: error === null || error === void 0 ? void 0 : error.message,
            status: error === null || error === void 0 ? void 0 : error.status,
            moreInfo: error === null || error === void 0 ? void 0 : error.moreInfo
        });
        let errorMessage = 'Unknown error occurred';
        // Check for Twilio authentication errors
        if ((error === null || error === void 0 ? void 0 : error.status) === 401 || (error === null || error === void 0 ? void 0 : error.code) === 20003 || ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('Authenticate')) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('authentication'))) {
            errorMessage = 'Twilio authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.';
        }
        // Check for Twilio error code 21612 (geographic permissions)
        else if (error.code === 21612) {
            errorMessage = `Cannot send SMS to ${params.phoneNumber}. Your Twilio number (${env_1.env.TWILIO_PHONE_NUMBER}) doesn't have permission to send to this country. Enable geographic permissions at: https://console.twilio.com/us1/develop/sms/settings/geo-permissions`;
        }
        // Check for invalid credentials
        else if ((error === null || error === void 0 ? void 0 : error.code) === 20003 || (error === null || error === void 0 ? void 0 : error.code) === 20403) {
            errorMessage = 'Twilio credentials are invalid or account is suspended. Please verify your Twilio account credentials.';
        }
        // Check for trial account limitations
        else if ((error === null || error === void 0 ? void 0 : error.code) === 21211 || ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('trial'))) {
            errorMessage = 'Twilio trial account limitation. Please verify the recipient number in your Twilio Console or upgrade your account.';
        }
        else if (error instanceof Error) {
            if (error.message.includes('Invalid phone number')) {
                errorMessage = 'Invalid phone number format';
            }
            else if (error.message.includes('Permission denied') || error.message.includes('cannot be sent')) {
                errorMessage = 'SMS service not available. Please enable geographic permissions for this country in your Twilio Console: https://console.twilio.com/us1/develop/sms/settings/geo-permissions';
            }
            else {
                errorMessage = error.message || 'Unknown Twilio error occurred';
            }
        }
        return {
            success: false,
            error: errorMessage
        };
    }
};
exports.sendLocationViaSMS = sendLocationViaSMS;
const sendLocationViaWhatsApp = async (params) => {
    try {
        let message;
        if (params.latitude && params.longitude) {
            // GPS location
            message = `🐾 *Pet Found Alert!*\n\n*${params.petName}* has been found!\n\n📍 *GPS Location:* ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
        }
        else {
            // Manual location
            message = `🐾 *Pet Found Alert!*\n\n*${params.petName}* has been found!\n\n📍 *Location:* ${params.locationUrl}\n\nPlease contact the finder to arrange pickup. Thank you for using Digital Tails!`;
        }
        console.log(`💬 Sending WhatsApp to: ${params.phoneNumber}`);
        const result = await client.messages.create({
            body: message,
            from: `whatsapp:${env_1.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${params.phoneNumber}`
        });
        return {
            success: true,
            messageId: result.sid
        };
    }
    catch (error) {
        console.error('Error sending WhatsApp message:', error);
        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
            if (error.message.includes('Invalid phone number')) {
                errorMessage = 'Invalid WhatsApp number format';
            }
            else if (error.message.includes('Permission denied') || error.message.includes('cannot be sent')) {
                errorMessage = 'WhatsApp service not available. Please verify the destination number in your Twilio account.';
            }
            else if (error.message.includes('not a WhatsApp number')) {
                errorMessage = 'This number is not registered with WhatsApp';
            }
            else {
                errorMessage = error.message;
            }
        }
        return {
            success: false,
            error: errorMessage
        };
    }
};
exports.sendLocationViaWhatsApp = sendLocationViaWhatsApp;
const sendLocationNotification = async (params) => {
    if (params.method === 'sms') {
        return await (0, exports.sendLocationViaSMS)(params);
    }
    else if (params.method === 'whatsapp') {
        return await (0, exports.sendLocationViaWhatsApp)(params);
    }
    else {
        return {
            success: false,
            error: 'Invalid method. Must be "sms" or "whatsapp"'
        };
    }
};
exports.sendLocationNotification = sendLocationNotification;
