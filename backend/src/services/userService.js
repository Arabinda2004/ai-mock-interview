const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// In-memory user storage for development mode
let inMemoryUsers = [];
let userIdCounter = 1;

// For development without PostgreSQL, disable database usage
let User = null;
let isPostgreSQLAvailable = false;

// Uncomment the following lines when PostgreSQL is available:
/*
try {
  const models = require('../models');
  User = models.User;
  isPostgreSQLAvailable = true;
} catch (error) {
  logger.warn('PostgreSQL User model not available, using in-memory storage');
}
*/

logger.info('Using in-memory storage for development mode');

class UserService {
  static async createUser({ email, password, firstName, lastName }) {
    // Use in-memory storage for development
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: userIdCounter++,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
    };
    inMemoryUsers.push(user);
    logger.info(`User created in memory: ${email}`);
    return user;
  }

  static async findUserByEmail(email) {
    return inMemoryUsers.find(u => u.email === email);
  }

  static async findUserById(id) {
    return inMemoryUsers.find(u => u.id === id);
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  static async updateLastLogin(user) {
    user.lastLoginAt = new Date();
  }

  static sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static getInMemoryUsers() {
    return inMemoryUsers;
  }
}

module.exports = UserService;