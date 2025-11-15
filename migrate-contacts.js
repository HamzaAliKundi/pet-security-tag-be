// Migration script to update Contact model from status enum to isRead boolean
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-security-tag', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ContactSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  purpose: String,
  message: String,
  status: String, // Old field
  isRead: Boolean, // New field
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', ContactSchema);

async function migrateContacts() {
  try {
    console.log('Starting contacts migration...');
    
    // Update all contacts that have status field but no isRead field
    // Set isRead to false if status is 'unread', true otherwise
    const contacts = await Contact.find({
      $or: [
        { isRead: { $exists: false } },
        { status: { $exists: true } }
      ]
    });
    
    let updatedCount = 0;
    
    for (const contact of contacts) {
      if (!contact.isRead && contact.status) {
        // Migrate from status to isRead
        contact.isRead = contact.status !== 'unread';
        // Remove the old status field
        contact.status = undefined;
        await contact.save();
        updatedCount++;
      } else if (!contact.isRead && !contact.status) {
        // Set default isRead to false if neither field exists
        contact.isRead = false;
        await contact.save();
        updatedCount++;
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} contacts.`);
    
    // Show statistics
    const total = await Contact.countDocuments();
    const read = await Contact.countDocuments({ isRead: true });
    const unread = await Contact.countDocuments({ isRead: false });
    
    console.log('Contact Statistics:');
    console.log(`Total: ${total}`);
    console.log(`Read: ${read}`);
    console.log(`Unread: ${unread}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateContacts();




