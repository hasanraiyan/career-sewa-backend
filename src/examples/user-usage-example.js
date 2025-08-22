import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Example usage of User model in controllers
 * These are typical patterns you'd use in your application
 */

// Example: User Registration
export const registerUser = async (userData) => {
  try {
    const { fullname, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user - password will be automatically hashed
    const user = new User({
      fullname,
      email,
      password,
      role: role || 'job_seeker'
    });

    const savedUser = await user.save();
    
    // Password is automatically excluded from JSON
    return {
      success: true,
      message: 'User registered successfully',
      user: savedUser.toJSON()
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: User Login
export const loginUser = async (email, password) => {
  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() })
                          .select('+password');
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.updateLastLogin();

    return {
      success: true,
      message: 'Login successful',
      user: user.toJSON() // Password excluded automatically
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: Get User Profile
export const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: user.toJSON()
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: Update User Profile
export const updateUserProfile = async (userId, updateData) => {
  try {
    // Remove sensitive fields that shouldn't be updated directly
    const { password, emailVerificationToken, passwordResetToken, ...safeUpdateData } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...safeUpdateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: Change Password
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password - will be automatically hashed by pre-save hook
    user.password = newPassword;
    await user.save();

    return {
      success: true,
      message: 'Password updated successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: Get All Active Users (Admin function)
export const getAllActiveUsers = async () => {
  try {
    const users = await User.findActiveUsers()
                          .select('-__v')
                          .sort({ createdAt: -1 });

    return {
      success: true,
      count: users.length,
      users: users.map(user => user.toJSON())
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example: Soft Delete User
export const deactivateUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'User deactivated successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Example demonstration of the functions
const demonstrateUsage = async () => {
  console.log('🔥 User Model Usage Examples');
  console.log('============================\n');

  // Simulate user registration
  console.log('1. 📝 User Registration Example:');
  const registrationResult = await registerUser({
    fullname: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: 'securePassword123',
    role: 'job_seeker'
  });
  console.log('   Result:', registrationResult.success ? '✅ Success' : '❌ Failed');
  console.log('   Message:', registrationResult.message);
  if (registrationResult.user) {
    console.log('   User ID:', registrationResult.user._id);
    console.log('   Email:', registrationResult.user.email);
    console.log('   Role:', registrationResult.user.role);
  }
  console.log();

  console.log('2. 🔐 User Login Example:');
  console.log('   This would verify password against hashed version in database');
  console.log('   - Email normalization: converts to lowercase');
  console.log('   - Password comparison: uses bcrypt.compare()');
  console.log('   - Last login update: automatically tracked');
  console.log();

  console.log('3. 🛡️ Security Features:');
  console.log('   ✓ Passwords are automatically hashed with bcrypt (salt rounds: 12)');
  console.log('   ✓ Sensitive fields excluded from JSON responses');
  console.log('   ✓ Email uniqueness enforced at database level');
  console.log('   ✓ Input validation on all fields');
  console.log('   ✓ Soft delete capability (deactivate instead of delete)');
  console.log();

  console.log('🎯 Ready to use in your Express controllers!');
};

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateUsage();
}