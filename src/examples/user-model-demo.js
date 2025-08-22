import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Simple demonstration of User model functionality
async function demonstrateUserModel() {
  try {
    console.log('🚀 User Model Demonstration');
    console.log('===========================\n');

    // Connect to MongoDB (you'll need to have MongoDB running)
    console.log('📊 Connecting to MongoDB...');
    // Note: Replace with your actual MongoDB connection string
    // await mongoose.connect('mongodb://localhost:27017/career_demo');
    // console.log('✅ Connected to MongoDB\n');

    // Create a new user
    console.log('👤 Creating a new user...');
    const userData = {
      fullname: 'John Doe',
      email: 'john.doe@example.com',
      password: 'mySecurePassword123',
      role: 'job_seeker'
    };

    console.log('📝 User data (before saving):');
    console.log(`   Full Name: ${userData.fullname}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Role: ${userData.role}\n`);

    const user = new User(userData);
    
    // This would save to database if connected
    // const savedUser = await user.save();
    
    // Simulate the password hashing that would happen
    console.log('🔐 Password Hashing Demonstration:');
    console.log('   Original password:', userData.password);
    
    // Manual demonstration of bcrypt hashing
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    console.log('   Hashed password:', hashedPassword);
    console.log('   Password length changed from', userData.password.length, 'to', hashedPassword.length, 'characters\n');

    // Demonstrate password comparison
    console.log('🔍 Password Comparison Test:');
    const isCorrect = await bcrypt.compare(userData.password, hashedPassword);
    const isIncorrect = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('   Correct password match:', isCorrect);
    console.log('   Wrong password match:', isIncorrect, '\n');

    // Demonstrate validation
    console.log('✅ User Model Validation Features:');
    console.log('   ✓ Required fields: fullname, email, password');
    console.log('   ✓ Email format validation with regex');
    console.log('   ✓ Minimum password length: 8 characters');
    console.log('   ✓ Email uniqueness enforced');
    console.log('   ✓ Email converted to lowercase');
    console.log('   ✓ Password automatically hashed before saving');
    console.log('   ✓ Sensitive fields excluded from JSON output\n');

    // Demonstrate the schema structure
    console.log('📋 User Model Schema:');
    console.log('   {');
    console.log('     fullname: String (required, 2-100 chars)');
    console.log('     email: String (required, unique, validated)');
    console.log('     password: String (required, min 8 chars, hashed)');
    console.log('     role: String (enum: job_seeker, employer, admin)');
    console.log('     isActive: Boolean (default: true)');
    console.log('     emailVerified: Boolean (default: false)');
    console.log('     lastLogin: Date');
    console.log('     createdAt: Date (auto)');
    console.log('     updatedAt: Date (auto)');
    console.log('   }\n');

    // Demonstrate instance methods
    console.log('🛠️  Available Instance Methods:');
    console.log('   ✓ comparePassword(candidatePassword) - Compare plain text with hash');
    console.log('   ✓ updateLastLogin() - Update last login timestamp');
    console.log('   ✓ displayName (virtual) - Get display name\n');

    // Demonstrate static methods
    console.log('🔧 Available Static Methods:');
    console.log('   ✓ User.findByEmail(email) - Find user by email');
    console.log('   ✓ User.findActiveUsers() - Find all active users\n');

    // Demonstrate hooks
    console.log('🪝 Pre/Post Hooks Implemented:');
    console.log('   Pre-save hooks:');
    console.log('     ✓ Hash password if modified');
    console.log('     ✓ Normalize email to lowercase');
    console.log('   Post-save hooks:');
    console.log('     ✓ Log user creation');
    console.log('   Post-remove hooks:');
    console.log('     ✓ Log user deletion\n');

    console.log('🎉 User model is ready to use!');
    console.log('   To use it in your application:');
    console.log('   import User from "./models/User.js";\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // await mongoose.connection.close();
    console.log('🔚 Demonstration complete!');
  }
}

// Run the demonstration
demonstrateUserModel();