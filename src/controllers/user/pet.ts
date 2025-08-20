import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Pet from '../../models/Pet';

// Create a new pet
export const createPet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
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
    const pet = await Pet.create({
      userId,
      userPetTagOrderId,
      petName: petName.trim(),
      hideName: hideName || false,
      age,
      breed: breed?.trim() || '',
      medication: medication?.trim() || '',
      allergies: allergies?.trim() || '',
      notes: notes?.trim() || ''
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
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({
      message: 'Failed to create pet',
      error: 'Internal server error'
    });
  }
});

// Get all pets for a user
export const getUserPets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [pets, totalPets] = await Promise.all([
      Pet.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status')
        .lean(),
      Pet.countDocuments({ userId })
    ]);

    const totalPages = Math.ceil(totalPets / limitNum);

    res.status(200).json({
      message: 'Pets retrieved successfully',
      status: 200,
      pets,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalPets,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting user pets:', error);
    res.status(500).json({
      message: 'Failed to get pets',
      error: 'Internal server error'
    });
  }
});

// Get a single pet by ID
export const getPet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { petId } = req.params;

  try {
    const pet = await Pet.findOne({ _id: petId, userId })
      .populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status')
      .lean();

    if (!pet) {
      res.status(404).json({
        message: 'Pet not found'
      });
      return;
    }

    res.status(200).json({
      message: 'Pet retrieved successfully',
      status: 200,
      pet
    });
  } catch (error) {
    console.error('Error getting pet:', error);
    res.status(500).json({
      message: 'Failed to get pet',
      error: 'Internal server error'
    });
  }
});

// Update a pet
export const updatePet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { petId } = req.params;
  const { petName, hideName, age, breed, medication, allergies, notes } = req.body;

  try {
    // Check if pet exists and belongs to user
    const existingPet = await Pet.findOne({ _id: petId, userId });
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
    const updatedPet = await Pet.findByIdAndUpdate(
      petId,
      {
        ...(petName !== undefined && { petName: petName.trim() }),
        ...(hideName !== undefined && { hideName }),
        ...(age !== undefined && { age }),
        ...(breed !== undefined && { breed: breed.trim() }),
        ...(medication !== undefined && { medication: medication.trim() }),
        ...(allergies !== undefined && { allergies: allergies.trim() }),
        ...(notes !== undefined && { notes: notes.trim() })
      },
      { new: true, runValidators: true }
    ).populate('userPetTagOrderId', 'petName quantity tagColor totalCostEuro status');

    res.status(200).json({
      message: 'Pet updated successfully',
      status: 200,
      pet: updatedPet
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      message: 'Failed to update pet',
      error: 'Internal server error'
    });
  }
});
