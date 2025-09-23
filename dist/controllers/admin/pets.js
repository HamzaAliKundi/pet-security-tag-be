"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPetStats = exports.deletePet = exports.getPetById = exports.getPets = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Pet_1 = __importDefault(require("../../models/Pet"));
// Get all pets with search, filtering, and pagination
exports.getPets = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { petName: { $regex: search, $options: 'i' } },
                { breed: { $regex: search, $options: 'i' } }
            ];
        }
        // Build status filter (for now, all pets are considered active)
        if (status && status !== 'all') {
            // Since we don't have status field yet, we'll filter by active (all pets)
            if (status === 'active') {
                // All pets are active for now
            }
            else if (status === 'inactive') {
                // No inactive pets for now
                searchQuery._id = null; // This will return no results
            }
            else if (status === 'suspended') {
                // No suspended pets for now
                searchQuery._id = null; // This will return no results
            }
        }
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute query with pagination and populate user info
        const pets = await Pet_1.default.find(searchQuery)
            .populate('userId', 'firstName lastName email')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Get total count for pagination
        const totalPets = await Pet_1.default.countDocuments(searchQuery);
        // Transform pets data to match frontend requirements
        const transformedPets = pets.map((pet) => {
            const user = pet.userId;
            return {
                id: pet._id,
                name: pet.petName,
                owner: user ? `${user.firstName} ${user.lastName}` : 'Unknown Owner',
                ownerEmail: user ? user.email : 'No Email',
                status: 'active', // Static status for now
                tagId: pet._id.toString().slice(-6).toUpperCase(), // Generate tag ID from pet ID
                breed: pet.breed || 'Unknown',
                age: pet.age || 0,
                lastSeen: pet.updatedAt ? new Date(pet.updatedAt).toISOString().split('T')[0] : 'Never',
                image: pet.image || null, // Include pet image
                // Additional fields for modal
                hideName: pet.hideName,
                medication: pet.medication || '',
                allergies: pet.allergies || '',
                notes: pet.notes || '',
                createdAt: pet.createdAt,
                updatedAt: pet.updatedAt
            };
        });
        res.status(200).json({
            message: 'Pets retrieved successfully',
            status: 200,
            pets: transformedPets,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalPets / limitNum),
                totalPets,
                petsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalPets / limitNum),
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting pets:', error);
        res.status(500).json({
            message: 'Failed to get pets',
            error: 'Internal server error'
        });
    }
});
// Get single pet by ID
exports.getPetById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { petId } = req.params;
        const pet = await Pet_1.default.findById(petId)
            .populate('userId', 'firstName lastName email')
            .lean();
        if (!pet) {
            res.status(404).json({
                message: 'Pet not found',
                error: 'Pet does not exist'
            });
            return;
        }
        const user = pet.userId;
        const transformedPet = {
            id: pet._id,
            name: pet.petName,
            owner: user ? `${user.firstName} ${user.lastName}` : 'Unknown Owner',
            ownerEmail: user ? user.email : 'No Email',
            status: 'active', // Static status for now
            tagId: pet._id.toString().slice(-6).toUpperCase(),
            breed: pet.breed || 'Unknown',
            age: pet.age || 0,
            lastSeen: pet.updatedAt ? new Date(pet.updatedAt).toISOString().split('T')[0] : 'Never',
            image: pet.image || null, // Include pet image
            hideName: pet.hideName,
            medication: pet.medication || '',
            allergies: pet.allergies || '',
            notes: pet.notes || '',
            createdAt: pet.createdAt,
            updatedAt: pet.updatedAt
        };
        res.status(200).json({
            message: 'Pet retrieved successfully',
            status: 200,
            pet: transformedPet
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
// Delete pet
exports.deletePet = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { petId } = req.params;
        // Check if pet exists
        const pet = await Pet_1.default.findById(petId);
        if (!pet) {
            res.status(404).json({
                message: 'Pet not found',
                error: 'Pet does not exist'
            });
            return;
        }
        // Delete pet
        await Pet_1.default.findByIdAndDelete(petId);
        res.status(200).json({
            message: 'Pet deleted successfully',
            status: 200
        });
    }
    catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({
            message: 'Failed to delete pet',
            error: 'Internal server error'
        });
    }
});
// Get pet statistics
exports.getPetStats = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const totalPets = await Pet_1.default.countDocuments();
        // For now, all pets are considered active
        const activePets = totalPets;
        res.status(200).json({
            message: 'Pet statistics retrieved successfully',
            status: 200,
            stats: {
                total: totalPets,
                active: activePets
            }
        });
    }
    catch (error) {
        console.error('Error getting pet statistics:', error);
        res.status(500).json({
            message: 'Failed to get pet statistics',
            error: 'Internal server error'
        });
    }
});
