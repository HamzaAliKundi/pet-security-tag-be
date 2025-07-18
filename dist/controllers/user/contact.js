"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactStatus = exports.getContact = exports.getAllContacts = exports.submitContact = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Contact_1 = __importDefault(require("../../models/Contact"));
// Submit a contact form
exports.submitContact = (0, express_async_handler_1.default)(async (req, res) => {
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
    const contact = await Contact_1.default.create({
        fullName,
        email,
        purpose,
        message,
        status: 'unread'
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
            status: contact.status,
            createdAt: contact.createdAt
        }
    });
});
// Get all contact submissions (for admin use)
exports.getAllContacts = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status && ['unread', 'read', 'replied'].includes(status)) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const contacts = await Contact_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await Contact_1.default.countDocuments(query);
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
exports.getContact = (0, express_async_handler_1.default)(async (req, res) => {
    const { contactId } = req.params;
    const contact = await Contact_1.default.findById(contactId);
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
            status: contact.status,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt
        }
    });
});
// Update contact status
exports.updateContactStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { contactId } = req.params;
    const { status } = req.body;
    const contact = await Contact_1.default.findById(contactId);
    if (!contact) {
        res.status(404).json({ message: 'Contact not found' });
        return;
    }
    // Validate status
    const validStatuses = ['unread', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
    }
    contact.status = status;
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
            status: contact.status,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt
        }
    });
});
