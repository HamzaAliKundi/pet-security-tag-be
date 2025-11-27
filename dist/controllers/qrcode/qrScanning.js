"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPetProfileByQR = exports.confirmSubscriptionPayment = exports.verifyQRCodeWithSubscription = exports.autoVerifyQRCode = exports.getQRVerificationDetails = exports.scanQRCode = exports.checkQRAvailability = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const QRCode_1 = __importDefault(require("../../models/QRCode"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const User_1 = __importDefault(require("../../models/User"));
const stripeService_1 = require("../../utils/stripeService");
const emailService_1 = require("../../utils/emailService");
// Check QR code availability (Public route)
exports.checkQRAvailability = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Count QR codes that are available (hasGiven is false)
        const availableCount = await QRCode_1.default.countDocuments({ hasGiven: false });
        // Check if there are any available QR codes
        const isAvailable = availableCount > 0;
        res.status(200).json({
            message: 'QR code availability checked',
            status: 200,
            isAvailable,
            availableCount
        });
    }
    catch (error) {
        console.error('Error checking QR code availability:', error);
        res.status(500).json({
            message: 'Failed to check QR code availability',
            error: 'Internal server error',
            status: 500
        });
    }
});
// Scan QR Code - Main entry point
exports.scanQRCode = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { code } = req.params;
        // Find QR code by code
        const qrCode = await QRCode_1.default.findOne({ code })
            .populate('assignedUserId', 'firstName lastName email')
            .populate('assignedPetId', 'petName breed age medication allergies notes hideName');
        if (!qrCode) {
            res.status(404).json({
                message: 'QR code not found',
                error: 'Invalid QR code',
                status: 404
            });
            return;
        }
        // Update scan count and last scanned date
        await QRCode_1.default.findByIdAndUpdate(qrCode._id, {
            $inc: { scannedCount: 1 },
            lastScannedAt: new Date()
        });
        // Check if QR code is assigned
        // If not assigned, it needs to be assigned when user logs in and pays for subscription
        if (!qrCode.assignedUserId || qrCode.status === 'unassigned') {
            // QR code is not assigned yet - redirect to verification flow
            res.status(200).json({
                message: 'QR code needs to be assigned and verified',
                status: 200,
                action: 'redirect_to_verification',
                qrCodeId: qrCode._id,
                code: qrCode.code,
                redirectUrl: `/qr/verify/${qrCode.code}`
            });
            return;
        }
        // Check if QR is verified and has active subscription
        if (qrCode.hasVerified && qrCode.status === 'verified') {
            // Check for active subscription by userId (one subscription covers all tags)
            // First try to find subscription linked to this QR code (for backward compatibility)
            let activeSubscription = await Subscription_1.default.findOne({
                qrCodeId: qrCode._id,
                status: 'active',
                endDate: { $gt: new Date() }
            });
            // If not found by qrCodeId, check by userId (since one subscription covers all tags)
            if (!activeSubscription && qrCode.assignedUserId) {
                activeSubscription = await Subscription_1.default.findOne({
                    userId: qrCode.assignedUserId,
                    status: 'active',
                    endDate: { $gt: new Date() },
                    amountPaid: { $gt: 0 } // Only use subscriptions with actual payment
                });
            }
            if (activeSubscription) {
                let petId = null;
                // Get petId from assignedPetId (could be ObjectId or populated object)
                if (qrCode.assignedPetId) {
                    petId = ((_b = (_a = qrCode.assignedPetId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = qrCode.assignedPetId) === null || _c === void 0 ? void 0 : _c.toString());
                }
                // If no direct pet link, try to find pet by order
                if (!petId && qrCode.assignedOrderId) {
                    const pet = await Pet_1.default.findOne({ userPetTagOrderId: qrCode.assignedOrderId });
                    if (pet) {
                        petId = pet._id.toString();
                        // Update QR code to link to this pet for future scans
                        await QRCode_1.default.findByIdAndUpdate(qrCode._id, { assignedPetId: pet._id });
                    }
                }
                // If still no petId, try to find any pet for this user that has this QR code assigned
                if (!petId && qrCode.assignedUserId) {
                    const userId = ((_e = (_d = qrCode.assignedUserId) === null || _d === void 0 ? void 0 : _d._id) === null || _e === void 0 ? void 0 : _e.toString()) || ((_f = qrCode.assignedUserId) === null || _f === void 0 ? void 0 : _f.toString());
                    const pet = await Pet_1.default.findOne({ userId });
                    if (pet) {
                        // Check if this QR code is assigned to this pet
                        const qrForPet = await QRCode_1.default.findOne({
                            assignedPetId: pet._id,
                            _id: qrCode._id
                        });
                        if (qrForPet) {
                            petId = pet._id.toString();
                        }
                    }
                }
                if (petId) {
                    // Redirect to public profile page for finder - QR is verified and subscription is active
                    res.status(200).json({
                        message: 'QR code verified - redirect to pet profile',
                        status: 200,
                        action: 'redirect_to_profile',
                        petId: petId,
                        redirectUrl: `/profile/${petId}`
                    });
                    return;
                }
                else {
                    console.error(`QR code ${qrCode.code} is verified but no petId found`);
                    // Even if we can't find petId, redirect to verification so user can see the issue
                    res.status(200).json({
                        message: 'QR code verified but pet information incomplete',
                        status: 200,
                        action: 'redirect_to_verification',
                        qrCodeId: qrCode._id,
                        code: qrCode.code,
                        redirectUrl: `/qr/verify/${qrCode.code}`
                    });
                    return;
                }
            }
            else {
                // QR is verified but subscription is expired - redirect to dashboard for renewal
                res.status(200).json({
                    message: 'QR code verified but subscription expired',
                    status: 200,
                    action: 'redirect_to_verification',
                    qrCodeId: qrCode._id,
                    code: qrCode.code,
                    redirectUrl: `/qr/verify/${qrCode.code}`
                });
                return;
            }
        }
        // If not verified or no active subscription, redirect to verification flow
        res.status(200).json({
            message: 'QR code needs verification',
            status: 200,
            action: 'redirect_to_verification',
            qrCodeId: qrCode._id,
            code: qrCode.code,
            redirectUrl: `/qr/verify/${qrCode.code}`
        });
    }
    catch (error) {
        console.error('Error scanning QR code:', error);
        res.status(500).json({
            message: 'Failed to scan QR code',
            error: 'Internal server error'
        });
    }
});
// Get QR verification details for frontend
exports.getQRVerificationDetails = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const { code } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // Get current logged-in user from JWT token
        const qrCode = await QRCode_1.default.findOne({ code })
            .populate('assignedUserId', 'firstName lastName email')
            .populate('assignedOrderId', 'petName totalCostEuro')
            .populate('assignedPetId', 'petName');
        if (!qrCode) {
            res.status(404).json({
                message: 'QR code not found',
                error: 'Invalid QR code'
            });
            return;
        }
        // Check if already verified
        if (qrCode.hasVerified) {
            // Check for active subscription by userId (since one subscription covers all tags)
            const userIdToCheck = ((_c = (_b = qrCode.assignedUserId) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || (currentUserId === null || currentUserId === void 0 ? void 0 : currentUserId.toString());
            let activeSubscription = null;
            if (userIdToCheck) {
                activeSubscription = await Subscription_1.default.findOne({
                    userId: userIdToCheck,
                    status: 'active',
                    endDate: { $gt: new Date() },
                    amountPaid: { $gt: 0 }
                });
            }
            res.status(200).json({
                message: 'QR code already verified',
                status: 200,
                isVerified: true,
                hasActiveSubscription: !!activeSubscription,
                qrCode: {
                    id: qrCode._id,
                    code: qrCode.code,
                    status: qrCode.status,
                    assignedPetName: ((_d = qrCode.assignedPetId) === null || _d === void 0 ? void 0 : _d.petName) || ((_e = qrCode.assignedOrderId) === null || _e === void 0 ? void 0 : _e.petName),
                    assignedUser: qrCode.assignedUserId
                },
                subscription: activeSubscription
            });
            return;
        }
        // For unverified QR codes, check if any user has active subscription
        let userHasActiveSubscription = false;
        let existingSubscription = null;
        let canAutoVerify = false;
        let verifiedQRCodesCount = 0;
        // Determine which userId to check (assigned user or current logged-in user)
        const userIdToCheck = ((_f = qrCode.assignedUserId) === null || _f === void 0 ? void 0 : _f.toString()) || (currentUserId === null || currentUserId === void 0 ? void 0 : currentUserId.toString());
        if (userIdToCheck) {
            // Check if user has active subscription
            existingSubscription = await Subscription_1.default.findOne({
                userId: userIdToCheck,
                status: 'active',
                endDate: { $gt: new Date() },
                amountPaid: { $gt: 0 } // Only use subscriptions with actual payment
            });
            userHasActiveSubscription = !!existingSubscription;
            // If user has active subscription, count how many QR codes are already verified
            if (existingSubscription) {
                verifiedQRCodesCount = await QRCode_1.default.countDocuments({
                    assignedUserId: userIdToCheck,
                    status: 'verified',
                    hasVerified: true
                });
                // Can auto-verify if user has subscription AND has less than 5 verified QR codes
                canAutoVerify = verifiedQRCodesCount < 5;
                console.log(`User ${userIdToCheck} has active subscription. Verified QR codes: ${verifiedQRCodesCount}/5. Can auto-verify: ${canAutoVerify}`);
            }
        }
        console.log('QR Verification Details Response:', {
            isVerified: false,
            hasActiveSubscription: userHasActiveSubscription,
            canAutoVerify: canAutoVerify,
            verifiedQRCodesCount: verifiedQRCodesCount,
            currentUserId: currentUserId,
            qrCodeAssignedUserId: qrCode.assignedUserId,
            requiresLogin: !qrCode.assignedUserId && !currentUserId
        });
        res.status(200).json({
            message: 'QR code verification details',
            status: 200,
            isVerified: false,
            hasActiveSubscription: userHasActiveSubscription,
            verifiedQRCodesCount: verifiedQRCodesCount,
            maxQRCodes: 5,
            qrCode: {
                id: qrCode._id,
                code: qrCode.code,
                status: qrCode.status,
                assignedPetName: ((_g = qrCode.assignedPetId) === null || _g === void 0 ? void 0 : _g.petName) || ((_h = qrCode.assignedOrderId) === null || _h === void 0 ? void 0 : _h.petName),
                assignedUser: qrCode.assignedUserId
            },
            subscription: existingSubscription,
            requiresLogin: !qrCode.assignedUserId && !currentUserId,
            canAutoVerify: canAutoVerify
        });
    }
    catch (error) {
        console.error('Error getting QR verification details:', error);
        res.status(500).json({
            message: 'Failed to get QR verification details',
            error: 'Internal server error'
        });
    }
});
// Auto-verify QR Code if user has active subscription
exports.autoVerifyQRCode = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { qrCodeId } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        // Find QR code
        const qrCode = await QRCode_1.default.findById(qrCodeId);
        if (!qrCode) {
            res.status(404).json({
                message: 'QR code not found',
                error: 'Invalid QR code ID'
            });
            return;
        }
        // Check if user has active subscription and count verified QR codes
        const activeSubscription = await Subscription_1.default.findOne({
            userId,
            status: 'active',
            endDate: { $gt: new Date() },
            amountPaid: { $gt: 0 } // Only use subscriptions with actual payment
        });
        if (!activeSubscription) {
            res.status(400).json({
                message: 'No active subscription found. Please subscribe to verify this QR code.',
                error: 'No active subscription'
            });
            return;
        }
        // Count verified QR codes for this user
        const verifiedQRCodesCount = await QRCode_1.default.countDocuments({
            assignedUserId: userId,
            status: 'verified',
            hasVerified: true
        });
        // Check if user has reached the limit of 5 QR codes
        if (verifiedQRCodesCount >= 5) {
            res.status(400).json({
                message: 'Maximum limit reached. You can only have 5 verified QR codes per subscription.',
                error: 'QR_CODE_LIMIT_EXCEEDED',
                verifiedCount: verifiedQRCodesCount,
                maxAllowed: 5
            });
            return;
        }
        // NEW FLOW: Assign QR code if not already assigned
        // This happens when user scans the tag and has active subscription
        if (!qrCode.assignedUserId || qrCode.status === 'unassigned') {
            // Find a pet for this user that doesn't have a QR code assigned yet
            let petToAssign = null;
            const userPets = await Pet_1.default.find({ userId });
            for (const pet of userPets) {
                const existingQR = await QRCode_1.default.findOne({ assignedPetId: pet._id, hasVerified: true });
                if (!existingQR) {
                    petToAssign = pet;
                    break;
                }
            }
            if (petToAssign) {
                // Assign QR code to this pet and user's order
                qrCode.assignedUserId = userId;
                qrCode.assignedPetId = petToAssign._id;
                qrCode.assignedOrderId = petToAssign.userPetTagOrderId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} auto-assigned to pet ${petToAssign.petName} (${petToAssign._id})`);
            }
            else {
                // If no pet found, assign to user without pet link
                qrCode.assignedUserId = userId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} auto-assigned to user ${userId} (no pet link yet)`);
            }
        }
        else if (qrCode.assignedUserId && qrCode.assignedUserId.toString() !== userId.toString()) {
            // QR code is already assigned to a different user
            res.status(400).json({
                message: 'This QR code is already assigned to another user',
                error: 'QR code already assigned'
            });
            return;
        }
        // Auto-verify the QR code (covered by existing subscription)
        qrCode.hasVerified = true;
        qrCode.status = 'verified';
        await qrCode.save();
        // Send first scan notification email (non-blocking)
        try {
            const user = await User_1.default.findById(userId);
            const pet = await Pet_1.default.findById(qrCode.assignedPetId);
            if (user && user.email && pet) {
                await (0, emailService_1.sendQRCodeFirstScanEmail)(user.email, {
                    petOwnerName: user.firstName || 'Pet Owner',
                    petName: pet.petName,
                    qrCode: qrCode.code,
                    scanDate: new Date().toLocaleDateString('en-GB'),
                    scanLocation: 'Unknown Location' // We don't have location data in this context
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send QR code first scan email:', emailError);
            // Don't fail the verification if email fails
        }
        // No need to create duplicate subscription - existing subscription covers all tags
        // Count verified QR codes for message
        const verifiedCount = await QRCode_1.default.countDocuments({
            assignedUserId: userId,
            status: 'verified',
            hasVerified: true
        });
        res.status(200).json({
            message: `Tag verified automatically using your existing subscription (${verifiedCount}/5 tags active)`,
            status: 200,
            qrCode: {
                id: qrCode._id,
                code: qrCode.code,
                status: qrCode.status,
                hasVerified: qrCode.hasVerified
            },
            subscription: activeSubscription,
            verifiedQRCodesCount: verifiedCount,
            maxQRCodes: 5,
            note: 'This tag is covered by your existing subscription. No additional payment required.'
        });
    }
    catch (error) {
        console.error('Error auto-verifying QR code:', error);
        res.status(500).json({
            message: 'Failed to auto-verify QR code',
            error: 'Internal server error'
        });
    }
});
// Verify QR Code with subscription
exports.verifyQRCodeWithSubscription = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let { qrCodeId, subscriptionType, petId, paymentMethodId, enableAutoRenew, amount, currency } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        if (!['monthly', 'yearly', 'lifetime'].includes(subscriptionType)) {
            res.status(400).json({
                message: 'Invalid subscription type',
                error: 'Subscription type must be monthly, yearly, or lifetime'
            });
            return;
        }
        // Find QR code
        const qrCode = await QRCode_1.default.findById(qrCodeId);
        if (!qrCode) {
            res.status(404).json({
                message: 'QR code not found',
                error: 'Invalid QR code ID'
            });
            return;
        }
        // Check if QR code is already assigned to a different user
        if (qrCode.assignedUserId && qrCode.assignedUserId.toString() !== userId.toString()) {
            res.status(400).json({
                message: 'This QR code is already assigned to another user',
                error: 'QR code already assigned'
            });
            return;
        }
        // NEW FLOW: Assign QR code if not already assigned (before checking subscriptions)
        if (!qrCode.assignedUserId || qrCode.status === 'unassigned') {
            // Find a pet for this user that doesn't have a QR code assigned yet
            let petToAssign = null;
            if (petId) {
                // Check if the provided pet is owned by this user and doesn't have QR code
                const pet = await Pet_1.default.findById(petId);
                if (pet && pet.userId.toString() === userId.toString()) {
                    const existingQR = await QRCode_1.default.findOne({ assignedPetId: pet._id });
                    if (!existingQR) {
                        petToAssign = pet;
                    }
                }
            }
            // If no pet specified or pet already has QR code, find first pet without QR code
            if (!petToAssign) {
                const userPets = await Pet_1.default.find({ userId });
                for (const pet of userPets) {
                    const existingQR = await QRCode_1.default.findOne({ assignedPetId: pet._id });
                    if (!existingQR) {
                        petToAssign = pet;
                        break;
                    }
                }
            }
            if (petToAssign) {
                // Assign QR code to this pet and user's order
                qrCode.assignedUserId = userId;
                qrCode.assignedPetId = petToAssign._id;
                qrCode.assignedOrderId = petToAssign.userPetTagOrderId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} assigned to pet ${petToAssign.petName} (${petToAssign._id}) via verifyQRWithSubscription`);
                // Update petId for later use
                petId = petToAssign._id.toString();
            }
            else {
                // If no pet found, still assign to user but without pet link
                qrCode.assignedUserId = userId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} assigned to user ${userId} (no pet link yet) via verifyQRWithSubscription`);
            }
        }
        // CRITICAL: Check if user has ANY existing active subscription BEFORE creating payment intent
        // One subscription covers all tags (up to 5), so we check by userId, not by qrCodeId
        // If they do, auto-verify instead of charging again
        const existingActiveSubscription = await Subscription_1.default.findOne({
            userId,
            status: 'active',
            endDate: { $gt: new Date() },
            amountPaid: { $gt: 0 } // Only use subscriptions with actual payment (not the £0 ones)
        });
        if (existingActiveSubscription) {
            // Count verified QR codes for this user
            const verifiedQRCodesCount = await QRCode_1.default.countDocuments({
                assignedUserId: userId,
                status: 'verified',
                hasVerified: true
            });
            // Check if user has reached the limit of 5 QR codes
            if (verifiedQRCodesCount >= 5) {
                res.status(400).json({
                    message: 'Maximum limit reached. You can only have 5 verified QR codes per subscription.',
                    error: 'QR_CODE_LIMIT_EXCEEDED',
                    verifiedCount: verifiedQRCodesCount,
                    maxAllowed: 5
                });
                return;
            }
            // Auto-verify if user has active subscription and hasn't reached limit
            qrCode.hasVerified = true;
            qrCode.status = 'verified';
            if (petId) {
                qrCode.assignedPetId = petId;
            }
            await qrCode.save();
            // Send first scan notification email (non-blocking)
            try {
                const user = await User_1.default.findById(userId);
                const pet = await Pet_1.default.findById(qrCode.assignedPetId);
                if (user && user.email && pet) {
                    await (0, emailService_1.sendQRCodeFirstScanEmail)(user.email, {
                        petOwnerName: user.firstName || 'Pet Owner',
                        petName: pet.petName,
                        qrCode: qrCode.code,
                        scanDate: new Date().toLocaleDateString('en-GB'),
                        scanLocation: 'Unknown Location' // We don't have location data in this context
                    });
                }
            }
            catch (emailError) {
                console.error('Failed to send QR code first scan email:', emailError);
                // Don't fail the verification if email fails
            }
            // No need to create duplicate subscription - existing subscription covers all tags
            res.status(200).json({
                message: `Tag verified automatically using your existing subscription (${verifiedQRCodesCount + 1}/5 tags active). No additional payment required.`,
                status: 200,
                qrCode: {
                    id: qrCode._id,
                    code: qrCode.code,
                    status: qrCode.status,
                    hasVerified: qrCode.hasVerified
                },
                subscription: existingActiveSubscription,
                verifiedQRCodesCount: verifiedQRCodesCount + 1,
                maxQRCodes: 5,
                note: 'This tag is covered by your existing subscription. No additional payment required.'
            });
            return;
        }
        // Use price from frontend (IP-based) or fallback to default pricing
        let finalAmount;
        let finalCurrency;
        if (amount && currency) {
            // Validate amount is reasonable (prevent manipulation)
            const minAmount = 0.01;
            const maxAmount = 1000;
            if (amount < minAmount || amount > maxAmount) {
                res.status(400).json({
                    message: 'Invalid amount',
                    error: `Amount must be between ${minAmount} and ${maxAmount}`
                });
                return;
            }
            finalAmount = amount;
            finalCurrency = currency.toLowerCase();
        }
        else {
            // Fallback to default pricing if not provided (backward compatibility)
            const defaultPricing = {
                monthly: 2.75,
                yearly: 28.99,
                lifetime: 129.99
            };
            finalAmount = defaultPricing[subscriptionType];
            finalCurrency = 'gbp';
        }
        const amountInCents = Math.round(finalAmount * 100);
        const endDate = new Date();
        if (subscriptionType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        else if (subscriptionType === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else if (subscriptionType === 'lifetime') {
            // Set end date to 100 years from now for lifetime subscription
            endDate.setFullYear(endDate.getFullYear() + 100);
        }
        // Get user for email
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                message: 'User not found',
                error: 'Invalid user ID'
            });
            return;
        }
        // For lifetime subscriptions, use Payment Intent (one-time payment)
        // For monthly/yearly with auto-renewal, use Stripe Subscription
        const shouldUseSubscription = (subscriptionType === 'monthly' || subscriptionType === 'yearly')
            && enableAutoRenew !== false
            && paymentMethodId;
        if (shouldUseSubscription) {
            // Create Stripe Subscription for auto-renewal
            const subscriptionResult = await (0, stripeService_1.createStripeSubscription)({
                customerEmail: user.email || '',
                customerName: user.firstName || user.email || 'Customer',
                amount: amountInCents,
                currency: finalCurrency,
                interval: subscriptionType === 'monthly' ? 'month' : 'year',
                paymentMethodId: paymentMethodId,
                metadata: {
                    userId: userId.toString(),
                    subscriptionType,
                    qrCodeId: qrCodeId.toString(),
                    petName: ((_b = qrCode.assignedPetId) === null || _b === void 0 ? void 0 : _b.petName) || 'Unknown Pet'
                },
            });
            if (!subscriptionResult.success) {
                res.status(500).json({
                    message: 'Failed to create subscription',
                    error: subscriptionResult.error
                });
                return;
            }
            res.status(200).json({
                message: 'Subscription created successfully',
                status: 200,
                subscription: {
                    subscriptionId: subscriptionResult.subscriptionId,
                    customerId: subscriptionResult.customerId,
                    clientSecret: subscriptionResult.clientSecret,
                    publishableKey: process.env.STRIPE_PUBLISH_KEY
                },
                payment: {
                    // For subscription, clientSecret is for the initial payment
                    clientSecret: subscriptionResult.clientSecret,
                    publishableKey: process.env.STRIPE_PUBLISH_KEY
                },
                subscriptionDetails: {
                    type: subscriptionType,
                    amount: finalAmount,
                    currency: finalCurrency.toUpperCase(),
                    endDate,
                    autoRenew: true
                },
                qrCode: {
                    id: qrCode._id,
                    code: qrCode.code
                }
            });
        }
        else {
            // Use Payment Intent for lifetime or when auto-renewal is disabled
            const paymentResult = await (0, stripeService_1.createSubscriptionPaymentIntent)({
                amount: amountInCents,
                currency: finalCurrency,
                metadata: {
                    userId: userId.toString(),
                    subscriptionType,
                    petName: ((_c = qrCode.assignedPetId) === null || _c === void 0 ? void 0 : _c.petName) || 'Unknown Pet'
                }
            });
            if (!paymentResult.success) {
                res.status(500).json({
                    message: 'Failed to create payment intent',
                    error: paymentResult.error
                });
                return;
            }
            res.status(200).json({
                message: 'Subscription payment intent created',
                status: 200,
                payment: {
                    paymentIntentId: paymentResult.paymentIntentId,
                    clientSecret: paymentResult.clientSecret,
                    publishableKey: process.env.STRIPE_PUBLISH_KEY
                },
                subscription: {
                    type: subscriptionType,
                    amount: finalAmount,
                    currency: finalCurrency.toUpperCase(),
                    endDate,
                    autoRenew: false
                },
                qrCode: {
                    id: qrCode._id,
                    code: qrCode.code
                }
            });
        }
    }
    catch (error) {
        console.error('Error verifying QR code:', error);
        res.status(500).json({
            message: 'Failed to verify QR code',
            error: 'Internal server error'
        });
    }
});
// Confirm subscription payment
exports.confirmSubscriptionPayment = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let { qrCodeId, paymentIntentId, subscriptionType, petId, stripeSubscriptionId, amount, currency } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        // Find QR code
        const qrCode = await QRCode_1.default.findById(qrCodeId);
        if (!qrCode) {
            res.status(404).json({
                message: 'QR code not found',
                error: 'Invalid QR code ID'
            });
            return;
        }
        // NEW FLOW: Assign QR code if not already assigned
        // This happens when user scans the tag and pays for subscription
        if (!qrCode.assignedUserId || qrCode.status === 'unassigned') {
            // Find a pet for this user that doesn't have a QR code assigned yet
            // Priority: Use petId if provided, otherwise find first unassigned pet
            let petToAssign = null;
            if (petId) {
                // Check if the provided pet is owned by this user and doesn't have QR code
                const pet = await Pet_1.default.findById(petId);
                if (pet && pet.userId.toString() === userId.toString()) {
                    const existingQR = await QRCode_1.default.findOne({ assignedPetId: pet._id });
                    if (!existingQR) {
                        petToAssign = pet;
                    }
                }
            }
            // If no pet specified or pet already has QR code, find first pet without QR code
            if (!petToAssign) {
                const userPets = await Pet_1.default.find({ userId });
                for (const pet of userPets) {
                    const existingQR = await QRCode_1.default.findOne({ assignedPetId: pet._id });
                    if (!existingQR) {
                        petToAssign = pet;
                        break;
                    }
                }
            }
            if (petToAssign) {
                // Assign QR code to this pet and user's order
                qrCode.assignedUserId = userId;
                qrCode.assignedPetId = petToAssign._id;
                qrCode.assignedOrderId = petToAssign.userPetTagOrderId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} assigned to pet ${petToAssign.petName} (${petToAssign._id})`);
                // Update petId for later use
                petId = petToAssign._id.toString();
            }
            else {
                // If no pet found, still assign to user but without pet link (will link later)
                qrCode.assignedUserId = userId;
                qrCode.status = 'assigned';
                qrCode.hasGiven = true;
                console.log(`✅ QR code ${qrCode.code} assigned to user ${userId} (no pet link yet)`);
            }
        }
        else if (qrCode.assignedUserId && qrCode.assignedUserId.toString() !== userId.toString()) {
            // QR code is already assigned to a different user
            res.status(400).json({
                message: 'This QR code is already assigned to another user',
                error: 'QR code already assigned'
            });
            return;
        }
        // CRITICAL: Check if user has ANY existing active subscription BEFORE processing payment
        // If they do, auto-verify instead of charging again
        const existingActiveSubscription = await Subscription_1.default.findOne({
            userId,
            status: 'active',
            endDate: { $gt: new Date() },
            amountPaid: { $gt: 0 } // Only use subscriptions with actual payment
        });
        if (existingActiveSubscription) {
            // Count verified QR codes for this user
            const verifiedQRCodesCount = await QRCode_1.default.countDocuments({
                assignedUserId: userId,
                status: 'verified',
                hasVerified: true
            });
            // Check if user has reached the limit of 5 QR codes
            if (verifiedQRCodesCount >= 5) {
                res.status(400).json({
                    message: 'Maximum limit reached. You can only have 5 verified QR codes per subscription.',
                    error: 'QR_CODE_LIMIT_EXCEEDED',
                    verifiedCount: verifiedQRCodesCount,
                    maxAllowed: 5
                });
                return;
            }
            // Auto-verify if user has active subscription and hasn't reached limit
            // No payment needed - existing subscription covers this tag
            qrCode.hasVerified = true;
            qrCode.status = 'verified';
            if (petId) {
                qrCode.assignedPetId = petId;
            }
            await qrCode.save();
            // Send first scan notification email (non-blocking)
            try {
                const user = await User_1.default.findById(userId);
                const pet = await Pet_1.default.findById(qrCode.assignedPetId);
                if (user && user.email && pet) {
                    await (0, emailService_1.sendQRCodeFirstScanEmail)(user.email, {
                        petOwnerName: user.firstName || 'Pet Owner',
                        petName: pet.petName,
                        qrCode: qrCode.code,
                        scanDate: new Date().toLocaleDateString('en-GB'),
                        scanLocation: 'Unknown Location'
                    });
                }
            }
            catch (emailError) {
                console.error('Failed to send QR code first scan email:', emailError);
            }
            res.status(200).json({
                message: `Tag verified automatically using your existing subscription (${verifiedQRCodesCount + 1}/5 tags active). No additional payment was charged.`,
                status: 200,
                qrCode: {
                    id: qrCode._id,
                    code: qrCode.code,
                    status: qrCode.status,
                    hasVerified: qrCode.hasVerified
                },
                subscription: existingActiveSubscription,
                verifiedQRCodesCount: verifiedQRCodesCount + 1,
                maxQRCodes: 5,
                note: 'This tag is covered by your existing subscription. No additional payment was charged.'
            });
            return;
        }
        // Verify payment with Stripe (you may need to implement this)
        // For now, we'll assume payment is successful
        // Calculate subscription end date
        const startDate = new Date();
        const endDate = new Date();
        if (subscriptionType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        else if (subscriptionType === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else if (subscriptionType === 'lifetime') {
            // Set end date to 100 years from now for lifetime subscription
            endDate.setFullYear(endDate.getFullYear() + 100);
        }
        // Use price from frontend or fallback to default pricing
        let finalAmount;
        let finalCurrency;
        if (amount && currency) {
            // Validate amount is reasonable
            const minAmount = 0.01;
            const maxAmount = 1000;
            if (amount < minAmount || amount > maxAmount) {
                res.status(400).json({
                    message: 'Invalid amount',
                    error: `Amount must be between ${minAmount} and ${maxAmount}`
                });
                return;
            }
            finalAmount = amount;
            finalCurrency = currency.toLowerCase();
        }
        else {
            // Fallback to default pricing if not provided (backward compatibility)
            const defaultPricing = {
                monthly: 2.75,
                yearly: 28.99,
                lifetime: 129.99
            };
            finalAmount = defaultPricing[subscriptionType];
            finalCurrency = 'gbp';
        }
        // Determine if this is an auto-renewal subscription
        const isAutoRenew = stripeSubscriptionId && (subscriptionType === 'monthly' || subscriptionType === 'yearly');
        // Check if subscription already exists with same paymentIntentId or stripeSubscriptionId
        let subscription;
        if (paymentIntentId) {
            subscription = await Subscription_1.default.findOne({
                paymentIntentId: paymentIntentId,
                userId: userId
            });
        }
        if (!subscription && stripeSubscriptionId) {
            subscription = await Subscription_1.default.findOne({
                stripeSubscriptionId: stripeSubscriptionId,
                userId: userId,
                status: 'active'
            });
        }
        if (subscription) {
            // Subscription already exists, update it instead of creating duplicate
            console.log(`Subscription already exists with ID: ${subscription._id}. Updating instead of creating duplicate.`);
            // Update existing subscription
            subscription.qrCodeId = qrCodeId;
            subscription.type = subscriptionType;
            subscription.status = 'active';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.amountPaid = finalAmount;
            subscription.currency = finalCurrency;
            subscription.autoRenew = isAutoRenew;
            if (paymentIntentId) {
                subscription.paymentIntentId = paymentIntentId;
            }
            if (stripeSubscriptionId) {
                subscription.stripeSubscriptionId = stripeSubscriptionId;
            }
            await subscription.save();
            console.log(`✅ Updated existing subscription record: ${subscription._id}`);
        }
        else {
            // Create new subscription record
            subscription = await Subscription_1.default.create({
                userId,
                qrCodeId,
                type: subscriptionType,
                status: 'active',
                startDate,
                endDate,
                paymentIntentId: paymentIntentId || undefined,
                stripeSubscriptionId: stripeSubscriptionId || undefined,
                amountPaid: finalAmount,
                currency: finalCurrency,
                autoRenew: isAutoRenew
            });
            console.log(`✅ Created new subscription record: ${subscription._id}`);
        }
        // Update QR code status
        qrCode.hasVerified = true;
        qrCode.status = 'verified';
        if (petId) {
            qrCode.assignedPetId = petId;
        }
        await qrCode.save();
        // Send first scan notification email (non-blocking)
        try {
            const user = await User_1.default.findById(userId);
            const pet = await Pet_1.default.findById(qrCode.assignedPetId);
            if (user && user.email && pet) {
                await (0, emailService_1.sendQRCodeFirstScanEmail)(user.email, {
                    petOwnerName: user.firstName || 'Pet Owner',
                    petName: pet.petName,
                    qrCode: qrCode.code,
                    scanDate: new Date().toLocaleDateString('en-GB'),
                    scanLocation: 'Unknown Location' // We don't have location data in this context
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send QR code first scan email:', emailError);
            // Don't fail the verification if email fails
        }
        console.log(`✅ Subscription record created in database: ${subscription._id}`);
        console.log(`   Type: ${subscription.type}, Status: ${subscription.status}, AutoRenew: ${subscription.autoRenew}`);
        console.log(`   Stripe Subscription ID: ${subscription.stripeSubscriptionId || 'N/A'}`);
        res.status(200).json({
            message: 'Subscription activated and QR code verified successfully',
            status: 200,
            qrCode: {
                id: qrCode._id,
                code: qrCode.code,
                status: qrCode.status,
                hasVerified: qrCode.hasVerified
            },
            subscription: {
                id: subscription._id,
                type: subscription.type,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                amountPaid: subscription.amountPaid,
                autoRenew: subscription.autoRenew,
                stripeSubscriptionId: subscription.stripeSubscriptionId
            }
        });
    }
    catch (error) {
        console.error('Error confirming subscription payment:', error);
        res.status(500).json({
            message: 'Failed to confirm subscription payment',
            error: 'Internal server error'
        });
    }
});
// Get pet profile for public view (when QR is scanned by finder)
exports.getPetProfileByQR = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { petId } = req.params;
        const pet = await Pet_1.default.findById(petId)
            .populate('userId', 'firstName lastName email phone street city state zipCode country')
            .populate('userPetTagOrderId', 'totalCostEuro tagColor');
        if (!pet) {
            res.status(404).json({
                message: 'Pet not found',
                error: 'Pet does not exist'
            });
            return;
        }
        // Check if pet has verified QR
        const qrCode = await QRCode_1.default.findOne({
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
        // Check active subscription by userId (one subscription covers all tags)
        // First try to find subscription linked to this QR code (for backward compatibility)
        let activeSubscription = await Subscription_1.default.findOne({
            qrCodeId: qrCode._id,
            status: 'active',
            endDate: { $gt: new Date() }
        });
        // If not found by qrCodeId, check by userId (since one subscription covers all tags)
        if (!activeSubscription && qrCode.assignedUserId) {
            activeSubscription = await Subscription_1.default.findOne({
                userId: qrCode.assignedUserId,
                status: 'active',
                endDate: { $gt: new Date() },
                amountPaid: { $gt: 0 } // Only use subscriptions with actual payment
            });
        }
        if (!activeSubscription) {
            res.status(403).json({
                message: 'Pet profile not accessible',
                error: 'Subscription expired'
            });
            return;
        }
        const user = pet.userId;
        const order = pet.userPetTagOrderId;
        // Transform data for public profile
        const petProfile = {
            petName: pet.hideName ? 'Pet' : pet.petName,
            breed: pet.breed || 'Mixed Breed',
            age: pet.age,
            medication: pet.medication || 'None',
            allergies: pet.allergies || 'None',
            notes: pet.notes || 'None',
            image: pet.image || null, // Include pet image
            tagColor: (order === null || order === void 0 ? void 0 : order.tagColor) || 'blue',
            owner: {
                name: `${user.firstName} ${user.lastName}`,
                // Hide full address for privacy
                address: {
                    street: user.street ? `***${user.street.slice(-4)}` : 'Hidden',
                    city: user.city || 'Unknown',
                    state: user.state || 'Unknown',
                    zipCode: user.zipCode || 'Unknown',
                    country: user.country || 'UK'
                },
                // Don't expose full contact details directly
                hasContactInfo: !!(user.email || user.phone)
            }
        };
        res.status(200).json({
            message: 'Pet profile retrieved successfully',
            status: 200,
            pet: petProfile,
            isPublicView: true,
            lastScanned: qrCode.lastScannedAt,
            scannedCount: qrCode.scannedCount
        });
    }
    catch (error) {
        console.error('Error getting pet profile:', error);
        res.status(500).json({
            message: 'Failed to get pet profile',
            error: 'Internal server error'
        });
    }
});
