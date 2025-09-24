import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Pet from '../../models/Pet';
import User from '../../models/User';

// Get all pets with search, filtering, and pagination
export const getPets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery: any = {};
    
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
      } else if (status === 'inactive') {
        // No inactive pets for now
        searchQuery._id = null; // This will return no results
      } else if (status === 'suspended') {
        // No suspended pets for now
        searchQuery._id = null; // This will return no results
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination and populate user info
    const pets = await Pet.find(searchQuery)
      .populate('userId', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalPets = await Pet.countDocuments(searchQuery);

    // Transform pets data to match frontend requirements
    const transformedPets = pets.map((pet) => {
      const user = pet.userId as any;
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
  } catch (error) {
    console.error('Error getting pets:', error);
    res.status(500).json({
      message: 'Failed to get pets',
      error: 'Internal server error'
    });
  }
});

// Get single pet by ID
export const getPetById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId } = req.params;

    const pet = await Pet.findById(petId)
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!pet) {
      res.status(404).json({
        message: 'Pet not found',
        error: 'Pet does not exist'
      });
      return;
    }

    const user = pet.userId as any;
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
  } catch (error) {
    console.error('Error getting pet:', error);
    res.status(500).json({
      message: 'Failed to get pet',
      error: 'Internal server error'
    });
  }
});

// Delete pet
export const deletePet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId } = req.params;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      res.status(404).json({
        message: 'Pet not found',
        error: 'Pet does not exist'
      });
      return;
    }

    // Delete pet
    await Pet.findByIdAndDelete(petId);

    res.status(200).json({
      message: 'Pet deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      message: 'Failed to delete pet',
      error: 'Internal server error'
    });
  }
});

// Get pet statistics
export const getPetStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const totalPets = await Pet.countDocuments();
    
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
  } catch (error) {
    console.error('Error getting pet statistics:', error);
    res.status(500).json({
      message: 'Failed to get pet statistics',
      error: 'Internal server error'
    });
  }
});
