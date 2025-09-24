// Migration script to add isDownloaded field to existing QR codes
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-security-tag', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const QRCodeSchema = new mongoose.Schema({
  code: String,
  imageUrl: String,
  hasGiven: Boolean,
  hasVerified: Boolean,
  assignedUserId: mongoose.Schema.Types.ObjectId,
  assignedOrderId: mongoose.Schema.Types.ObjectId,
  assignedPetId: mongoose.Schema.Types.ObjectId,
  status: String,
  scannedCount: Number,
  lastScannedAt: Date,
  isDownloaded: Boolean,
  downloadedAt: Date
}, {
  timestamps: true
});

const QRCode = mongoose.model('QRCode', QRCodeSchema);

async function migrateQRCodes() {
  try {
    console.log('Starting QR codes migration...');
    
    // Update all QR codes that don't have isDownloaded field
    const result = await QRCode.updateMany(
      { isDownloaded: { $exists: false } },
      { $set: { isDownloaded: false } }
    );
    
    console.log(`Migration completed. Updated ${result.modifiedCount} QR codes.`);
    
    // Show statistics
    const total = await QRCode.countDocuments();
    const downloaded = await QRCode.countDocuments({ isDownloaded: true });
    const nonDownloaded = await QRCode.countDocuments({ isDownloaded: false });
    
    console.log('QR Code Statistics:');
    console.log(`Total: ${total}`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Non-downloaded: ${nonDownloaded}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateQRCodes();
