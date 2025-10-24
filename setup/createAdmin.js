import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Admin from '../models/admin.js'; 

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Admin User Schema


async function createAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database successfully!');
    
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: 'admin@clinic.com' });
    
    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@clinic.com');
      console.log('🔐 Use your existing password to login');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log('🔄 Creating admin user...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const admin = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      isActive: true
    });
    
    await admin.save();
    
    console.log('');
    console.log('✅ =======================================');
    console.log('✅ Admin user created successfully!');
    console.log('✅ =======================================');
    console.log('');
    console.log('📧 Email:    admin@clinic.com');
    console.log('🔐 Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
    console.log('');
    
    await mongoose.connection.close();
    console.log('🔒 Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ =======================================');
    console.error('❌ Error creating admin user');
    console.error('❌ =======================================');
    console.error('');
    console.error('Error details:', error.message);
    
    if (error.code === 11000) {
      console.error('');
      console.error('⚠️  An admin with this email already exists!');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
}


createAdmin();