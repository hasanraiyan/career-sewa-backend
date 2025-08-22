import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Mock MongoDB connection for testing
beforeAll(async () => {
  // Use in-memory database for testing
  const mongoUri = 'mongodb://127.0.0.1:27017/career_test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

afterAll(async () => {
  // Clean up
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up after each test
  await User.deleteMany({});
});

describe('User Model Tests', () => {
  describe('User Creation', () => {
    test('should create a new user with hashed password', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password: 'testpassword123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.fullname).toBe(userData.fullname);
      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.password).not.toBe(userData.password); // Password should be hashed
      expect(savedUser.password.length).toBeGreaterThan(50); // Hashed password is much longer
      expect(savedUser.role).toBe('job_seeker'); // Default role
      expect(savedUser.isActive).toBe(true); // Default active status
      expect(savedUser.emailVerified).toBe(false); // Default email verification status
    });

    test('should validate required fields', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.fullname).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test('should validate email format', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'invalid-email',
        password: 'testpassword123'
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test('should enforce minimum password length', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password: '123' // Too short
      };

      const user = new User(userData);

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test('should enforce email uniqueness', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password: 'testpassword123'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User({
        ...userData,
        fullname: 'Jane Doe'
      });

      let error;
      try {
        await user2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });
  });

  describe('Password Methods', () => {
    test('should compare password correctly', async () => {
      const password = 'testpassword123';
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // To get password for comparison, we need to select it explicitly
      const userWithPassword = await User.findById(savedUser._id).select('+password');

      const isMatch = await userWithPassword.comparePassword(password);
      const isWrongMatch = await userWithPassword.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('should find user by email', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'John.Doe@Example.com',
        password: 'testpassword123'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findByEmail('john.doe@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('john.doe@example.com');
    });

    test('should find active users', async () => {
      // Create active user
      const activeUser = new User({
        fullname: 'Active User',
        email: 'active@example.com',
        password: 'testpassword123'
      });
      await activeUser.save();

      // Create inactive user
      const inactiveUser = new User({
        fullname: 'Inactive User',
        email: 'inactive@example.com',
        password: 'testpassword123',
        isActive: false
      });
      await inactiveUser.save();

      const activeUsers = await User.findActiveUsers();

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].email).toBe('active@example.com');
    });
  });

  describe('JSON Transformation', () => {
    test('should exclude sensitive fields from JSON', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password: 'testpassword123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const userJSON = savedUser.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.emailVerificationToken).toBeUndefined();
      expect(userJSON.passwordResetToken).toBeUndefined();
      expect(userJSON.passwordResetExpires).toBeUndefined();
    });
  });

  describe('Virtual Properties', () => {
    test('should return display name', async () => {
      const userData = {
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        password: 'testpassword123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.displayName).toBe('John Doe');
    });

    test('should fallback to email for display name when fullname is empty', async () => {
      const userData = {
        fullname: '',
        email: 'john.doe@example.com',
        password: 'testpassword123'
      };

      const user = new User(userData);
      user.fullname = '';

      expect(user.displayName).toBe('john.doe@example.com');
    });
  });
});