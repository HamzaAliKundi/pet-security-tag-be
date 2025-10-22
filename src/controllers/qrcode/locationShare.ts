import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import QRCode from '../../models/QRCode';
import Pet from '../../models/Pet';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import PetTagOrder from '../../models/PetTagOrder';
import User from '../../models/User';
import { sendLocationNotification } from '../../utils/twilioService';

export const shareLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId, method, latitude, longitude, locationUrl, petName, isManualLocation } = req.body;

    if (!petId || !method || !locationUrl) {
      res.status(400).json({
        message: 'Missing required fields: petId, method, locationUrl',
        error: 'Invalid request data'
      });
      return;
    }

    // For GPS location, require coordinates
    if (!isManualLocation && (!latitude || !longitude)) {
      res.status(400).json({
        message: 'Missing required fields: latitude, longitude for GPS location',
        error: 'Invalid request data'
      });
      return;
    }

    if (!['sms', 'whatsapp', 'get-phone'].includes(method)) {
      res.status(400).json({
        message: 'Invalid method. Must be "sms", "whatsapp", or "get-phone"',
        error: 'Invalid method'
      });
      return;
    }

    // Find the pet and get owner information
    const pet = await Pet.findById(petId)
      .populate('userId', 'firstName lastName email phone')
      .populate('userPetTagOrderId', 'phone name email petName userId');

    if (!pet) {
      res.status(404).json({
        message: 'Pet not found',
        error: 'Pet does not exist'
      });
      return;
    }

    // Check if pet has verified QR
    const qrCode = await QRCode.findOne({
      assignedPetId: petId,
      hasVerified: true,
      status: 'verified'
    });

    if (!qrCode) {
      res.status(404).json({
        message: 'Pet profile not accessible',
        error: 'QR code not verified or subscription inactive'
      });
      return;
    }

    // Get phone number from the order
    let phoneNumber = '';
    let ownerName = 'Pet Owner';
    let phoneSource = '';

    const orderType = (pet as any).orderType;
    const orderIdRaw = (pet as any).userPetTagOrderId;
    
    console.log(`🔍 Pet details:`, {
      petId: pet._id,
      petName: pet.petName,
      orderType,
      userPetTagOrderId: orderIdRaw,
      isPopulated: typeof orderIdRaw === 'object' && orderIdRaw !== null && orderIdRaw._id !== undefined
    });

    // Check if userPetTagOrderId is already populated and has phone
    if (orderIdRaw && typeof orderIdRaw === 'object' && orderIdRaw._id) {
      const order = orderIdRaw as any;
      console.log(`✅ Order already populated:`, {
        _id: order._id,
        phone: order.phone,
        name: order.name,
        email: order.email,
        hasPhone: !!order.phone,
        orderType
      });
      
      if (order.phone) {
        phoneNumber = order.phone;
        phoneSource = `${orderType || 'Unknown'} (populated)`;
        ownerName = order.name || 'Pet Owner';
        console.log(`📞 Phone from populated order: ${phoneNumber}`);
      } else {
        console.log(`⚠️  Populated order has no phone field. Will fetch manually.`);
      }
    }
    
    // If phone not found in populated data, fetch manually
    if (!phoneNumber) {
      // Get the order ID (might be ObjectId or populated object)
      const orderId = orderIdRaw?._id || orderIdRaw;
      
      console.log(`⚠️  Need to fetch order manually:`, {
        orderId,
        orderType,
        reason: orderIdRaw?._id ? 'phone field missing in populated data' : 'order not populated'
      });

      if (orderType === 'UserPetTagOrder') {
        const userOrder = await UserPetTagOrder.findById(orderId).populate('userId', 'firstName lastName email phone');
        
        console.log(`🔍 UserPetTagOrder fetched:`, {
          _id: userOrder?._id,
          phone: userOrder?.phone,
          hasPhone: !!userOrder?.phone
        });
        
        if (userOrder?.phone) {
          phoneNumber = userOrder.phone;
          phoneSource = 'UserPetTagOrder (manual fetch)';
          ownerName = `${(userOrder.userId as any)?.firstName || ''} ${(userOrder.userId as any)?.lastName || ''}`.trim() || 'Pet Owner';
          console.log(`📞 Phone from UserPetTagOrder: ${phoneNumber}`);
        }
      } else if (orderType === 'PetTagOrder' || !orderType) {
        // Try PetTagOrder (either explicitly specified or as fallback if orderType is undefined)
        const petTagOrder = await PetTagOrder.findById(orderId);
        
        console.log(`🔍 PetTagOrder fetched:`, {
          _id: petTagOrder?._id,
          petName: petTagOrder?.petName,
          email: petTagOrder?.email,
          phone: petTagOrder?.phone,
          hasPhone: !!petTagOrder?.phone
        });
        
        if (petTagOrder?.phone) {
          phoneNumber = petTagOrder.phone;
          phoneSource = 'PetTagOrder (manual fetch)';
          ownerName = petTagOrder.name || 'Pet Owner';
          console.log(`📞 Phone from PetTagOrder: ${phoneNumber}`);
        } else if (!orderType) {
          // If orderType was undefined, also try UserPetTagOrder as fallback
          console.log(`⚠️  PetTagOrder had no phone. Trying UserPetTagOrder as fallback...`);
          const userOrder = await UserPetTagOrder.findById(orderId).populate('userId', 'firstName lastName email phone');
          
          if (userOrder?.phone) {
            phoneNumber = userOrder.phone;
            phoneSource = 'UserPetTagOrder (fallback fetch)';
            ownerName = `${(userOrder.userId as any)?.firstName || ''} ${(userOrder.userId as any)?.lastName || ''}`.trim() || 'Pet Owner';
            console.log(`📞 Phone from UserPetTagOrder (fallback): ${phoneNumber}`);
          }
        }
      }
    }

    // Fallback: Try User model
    if (!phoneNumber && pet.userId) {
      const user = pet.userId as any;
      if (user.phone) {
        phoneNumber = user.phone;
        phoneSource = 'User (fallback)';
        ownerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Pet Owner';
        console.log(`📞 Phone from User fallback: ${phoneNumber}`);
      }
    }

    if (!phoneNumber) {
      res.status(404).json({
        message: 'Pet owner phone number not found in database',
        error: 'Unable to contact pet owner - no phone number registered'
      });
      return;
    }

    console.log(`📱 Original phone number from ${phoneSource}: ${phoneNumber}`);

    // Format phone number (ensure it starts with country code)
    let formattedPhone = phoneNumber;
    
    // Handle phone numbers that may have lost the + sign
    if (!formattedPhone.startsWith('+')) {
      console.log(`⚠️  Phone number missing + sign. Original: ${phoneNumber}`);
      
      // Check if it starts with country code without +
      if (formattedPhone.startsWith('92')) {
        // Pakistan number without +
        formattedPhone = '+' + formattedPhone;
        console.log(`✅ Added + to Pakistan number: ${formattedPhone}`);
      } else if (formattedPhone.startsWith('44')) {
        // UK number without +
        formattedPhone = '+' + formattedPhone;
        console.log(`✅ Added + to UK number: ${formattedPhone}`);
      } else if (formattedPhone.startsWith('0')) {
        // Local format number - need to determine country
        console.log(`⚠️  Local format number detected. Need country code.`);
        res.status(400).json({
          message: 'Invalid phone number format',
          error: `Phone number must include country code (e.g., +92 for Pakistan, +44 for UK). Found: ${phoneNumber}`,
          phoneSource
        });
        return;
      } else {
        // Unknown format
        res.status(400).json({
          message: 'Invalid phone number format',
          error: `Phone number must include country code (e.g., +92 for Pakistan, +44 for UK). Found: ${phoneNumber}`,
          phoneSource
        });
        return;
      }
    }

    console.log(`✅ Formatted phone number: ${formattedPhone}`);

    // If method is 'get-phone', just return the phone number without sending
    if (method === 'get-phone') {
      console.log(`📞 Returning phone number for WhatsApp (no SMS sent)`);
      res.status(200).json({
        message: 'Phone number retrieved successfully',
        status: 200,
        phoneNumber: formattedPhone, // Return unmasked for WhatsApp link
        ownerName
      });
      return;
    }

    // Send location notification via Twilio (SMS only)
    const result = await sendLocationNotification({
      petId,
      method,
      latitude,
      longitude,
      locationUrl,
      petName: petName || pet.petName,
      phoneNumber: formattedPhone,
      ownerName
    });

    if (result.success) {
      res.status(200).json({
        message: `Location shared successfully via ${method.toUpperCase()}`,
        status: 200,
        messageId: result.messageId,
        phoneNumber: formattedPhone.replace(/\d(?=\d{4})/g, '*'), // Mask phone number for privacy
        ownerName
      });
    } else {
      res.status(500).json({
        message: `Failed to send ${method.toUpperCase()} notification`,
        error: result.error || 'Twilio service error occurred'
      });
    }

  } catch (error) {
    console.error('Error sharing location:', error);
    res.status(500).json({
      message: 'Internal server error while sharing location',
      error: 'Internal server error'
    });
  }
});
