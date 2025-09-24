"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPetImage = exports.updatePet = exports.getPet = exports.getUserPets = exports.createPet = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const QRCode_1 = __importDefault(require("../../models/QRCode"));
const imageUploadService_1 = require("../../utils/imageUploadService");
// Create a new pet
exports.createPet = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { userPetTagOrderId, petName, hideName, age, breed, medication, allergies, notes } = req.body;
    // Validate required fields
    if (!userPetTagOrderId || !petName) {
        res.status(400).json({
            message: 'userPetTagOrderId and petName are required'
        });
        return;
    }
    // Validate pet name
    if (typeof petName !== 'string' || petName.trim().length === 0) {
        res.status(400).json({ message: 'Pet name is required' });
        return;
    }
    // Validate age if provided
    if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 30)) {
        res.status(400).json({ message: 'Age must be a number between 0 and 30' });
        return;
    }
    try {
        const pet = await Pet_1.default.create({
            userId,
            userPetTagOrderId,
            petName: petName.trim(),
            hideName: hideName || false,
            age,
            breed: (breed === null || breed === void 0 ? void 0 : breed.trim()) || '',
            medication: (medication === null || medication === void 0 ? void 0 : medication.trim()) || '',
            allergies: (allergies === null || allergies === void 0 ? void 0 : allergies.trim()) || '',
            notes: (notes === null || notes === void 0 ? void 0 : notes.trim()) || ''
        });
        res.status(201).json({
            message: 'Pet created successfully',
            status: 201,
            pet: {
                _id: pet._id,
                userId: pet.userId,
                userPetTagOrderId: pet.userPetTagOrderId,
                petName: pet.petName,
                hideName: pet.hideName,
                age: pet.age,
                breed: pet.breed,
                medication: pet.medication,
                allergies: pet.allergies,
                notes: pet.notes,
                createdAt: pet.createdAt,
                updatedAt: pet.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error creating pet:', error);
        res.status(500).json({
            message: 'Failed to create pet',
            error: 'Internal server error'
        });
    }
});
// Get all pets for a user
exports.getUserPets = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10 } = req.query;
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [pets, totalPets] = await Promise.all([
            Pet_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status')
                .lean(),
            Pet_1.default.countDocuments({ userId })
        ]);
        // Get QR code information for each pet
        const petsWithQRInfo = await Promise.all(pets.map(async (pet) => {
            const qrCode = await QRCode_1.default.findOne({ assignedPetId: pet._id })
                .select('code status hasVerified scannedCount lastScannedAt imageUrl')
                .lean();
            return {
                ...pet,
                qrCode: qrCode ? {
                    code: qrCode.code,
                    status: qrCode.status,
                    hasVerified: qrCode.hasVerified,
                    scannedCount: qrCode.scannedCount,
                    lastScannedAt: qrCode.lastScannedAt,
                    imageUrl: qrCode.imageUrl
                } : null
            };
        }));
        const totalPages = Math.ceil(totalPets / limitNum);
        res.status(200).json({
            message: 'Pets retrieved successfully',
            status: 200,
            pets: petsWithQRInfo,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalPets,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting user pets:', error);
        res.status(500).json({
            message: 'Failed to get pets',
            error: 'Internal server error'
        });
    }
});
// Get a single pet by ID
exports.getPet = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { petId } = req.params;
    try {
        const pet = await Pet_1.default.findOne({ _id: petId, userId })
            .populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status')
            .lean();
        if (!pet) {
            res.status(404).json({
                message: 'Pet not found'
            });
            return;
        }
        // Get QR code information for the pet
        const qrCode = await QRCode_1.default.findOne({ assignedPetId: pet._id })
            .select('code status hasVerified scannedCount lastScannedAt imageUrl')
            .lean();
        const petWithQRInfo = {
            ...pet,
            qrCode: qrCode ? {
                code: qrCode.code,
                status: qrCode.status,
                hasVerified: qrCode.hasVerified,
                scannedCount: qrCode.scannedCount,
                lastScannedAt: qrCode.lastScannedAt,
                imageUrl: qrCode.imageUrl
            } : null
        };
        res.status(200).json({
            message: 'Pet retrieved successfully',
            status: 200,
            pet: petWithQRInfo
        });
    }
    catch (error) {
        console.error('Error getting pet:', error);
        res.status(500).json({
            message: 'Failed to get pet',
            error: 'Internal server error'
        });
    }
});
// Update a pet
exports.updatePet = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { petId } = req.params;
    const { petName, hideName, age, breed, medication, allergies, notes } = req.body;
    try {
        // Check if pet exists and belongs to user
        const existingPet = await Pet_1.default.findOne({ _id: petId, userId });
        if (!existingPet) {
            res.status(404).json({
                message: 'Pet not found'
            });
            return;
        }
        // Validate pet name if provided
        if (petName !== undefined && (typeof petName !== 'string' || petName.trim().length === 0)) {
            res.status(400).json({ message: 'Pet name cannot be empty' });
            return;
        }
        // Validate age if provided
        if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 30)) {
            res.status(400).json({ message: 'Age must be a number between 0 and 30' });
            return;
        }
        // Update pet
        const updatedPet = await Pet_1.default.findByIdAndUpdate(petId, {
            ...(petName !== undefined && { petName: petName.trim() }),
            ...(hideName !== undefined && { hideName }),
            ...(age !== undefined && { age }),
            ...(breed !== undefined && { breed: breed.trim() }),
            ...(medication !== undefined && { medication: medication.trim() }),
            ...(allergies !== undefined && { allergies: allergies.trim() }),
            ...(notes !== undefined && { notes: notes.trim() })
        }, { new: true, runValidators: true }).populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status');
        res.status(200).json({
            message: 'Pet updated successfully',
            status: 200,
            pet: updatedPet
        });
    }
    catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({
            message: 'Failed to update pet',
            error: 'Internal server error'
        });
    }
});
// Upload pet image
exports.uploadPetImage = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { petId } = req.params;
    if (!req.file) {
        res.status(400).json({
            message: 'No image file provided'
        });
        return;
    }
    try {
        // Check if pet exists and belongs to user
        const existingPet = await Pet_1.default.findOne({ _id: petId, userId });
        if (!existingPet) {
            res.status(404).json({
                message: 'Pet not found'
            });
            return;
        }
        // Delete old image if exists
        if (existingPet.image) {
            try {
                // Extract public ID from URL and delete
                const urlParts = existingPet.image.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const publicId = `pet-security-tags/pets/${fileName.split('.')[0]}`;
                await (0, imageUploadService_1.deleteImageFromCloudinary)(publicId);
            }
            catch (deleteError) {
                console.error('Error deleting old image:', deleteError);
                // Continue even if deletion fails
            }
        }
        // Upload new image
        const result = await (0, imageUploadService_1.uploadImageToCloudinary)(req.file.buffer, `${petId}-${Date.now()}`);
        // Update pet with new image URL
        const updatedPet = await Pet_1.default.findByIdAndUpdate(petId, { image: result.url }, { new: true, runValidators: true }).populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status');
        res.status(200).json({
            message: 'Pet image uploaded successfully',
            status: 200,
            pet: updatedPet,
            imageUrl: result.url
        });
    }
    catch (error) {
        console.error('Error uploading pet image:', error);
        res.status(500).json({
            message: 'Failed to upload pet image',
            error: 'Internal server error'
        });
    }
});
