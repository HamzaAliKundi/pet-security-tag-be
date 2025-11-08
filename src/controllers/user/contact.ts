import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Contact from '../../models/Contact';

// Submit a contact form
export const submitContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, purpose, message } = req.body;

  // Validate required fields
  if (!fullName || !email || !purpose || !message) {
    res.status(400).json({ 
      message: 'All fields are required: fullName, email, purpose, message' 
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Invalid email format' });
    return;
  }

  // Validate message length
  if (message.trim().length < 10) {
    res.status(400).json({ message: 'Message must be at least 10 characters long' });
    return;
  }

  // Create the contact submission
  const contact = await Contact.create({
    fullName,
    email,
    purpose,
    message,
    isRead: false
  });

  res.status(201).json({
    message: 'Contact form submitted successfully',
    status: 201,
    contact: {
      _id: contact._id,
      fullName: contact.fullName,
      email: contact.email,
      purpose: contact.purpose,
      message: contact.message,
      isRead: contact.isRead,
      createdAt: contact.createdAt
    }
  });
});

// Get all contact submissions (for admin use)
export const getAllContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { isRead, page = 1, limit = 10, search } = req.query;
  
  const query: any = {};
  
  // Filter by isRead status
  if (isRead !== undefined && isRead !== 'all') {
    const isReadStr = String(isRead);
    query.isRead = isReadStr === 'true';
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { fullName: { $regex: search as string, $options: 'i' } },
      { email: { $regex: search as string, $options: 'i' } },
      { purpose: { $regex: search as string, $options: 'i' } },
      { message: { $regex: search as string, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Contact.countDocuments(query);

  res.status(200).json({
    message: 'Contacts retrieved successfully',
    status: 200,
    contacts,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalContacts: total,
      hasNextPage: skip + contacts.length < total,
      hasPrevPage: Number(page) > 1
    }
  });
});

// Get contact by ID
export const getContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { contactId } = req.params;

  const contact = await Contact.findById(contactId);
  if (!contact) {
    res.status(404).json({ message: 'Contact not found' });
    return;
  }

  res.status(200).json({
    message: 'Contact retrieved successfully',
    status: 200,
    contact: {
      _id: contact._id,
      fullName: contact.fullName,
      email: contact.email,
      purpose: contact.purpose,
      message: contact.message,
      isRead: contact.isRead,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }
  });
});

// Update contact read status
export const updateContactStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { contactId } = req.params;
  const { isRead } = req.body;

  const contact = await Contact.findById(contactId);
  if (!contact) {
    res.status(404).json({ message: 'Contact not found' });
    return;
  }

  // Validate isRead - should be boolean
  if (typeof isRead !== 'boolean') {
    res.status(400).json({ message: 'isRead must be a boolean value' });
    return;
  }

  contact.isRead = isRead;
  await contact.save();

  res.status(200).json({
    message: 'Contact status updated successfully',
    status: 200,
    contact: {
      _id: contact._id,
      fullName: contact.fullName,
      email: contact.email,
      purpose: contact.purpose,
      message: contact.message,
      isRead: contact.isRead,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }
  });
}); 