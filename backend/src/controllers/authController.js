const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Public citizen registration
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return sendError(res, 400, 'Name is required');
    }

    if (!email || email.trim() === '') {
      return sendError(res, 400, 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    if (!password || password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, 'Email is already registered');
    }

    // Enforce default public registration role to CITIZEN
    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : null,
      role: 'CITIZEN'
    });

    const token = generateToken(newUser);

    return sendSuccess(res, 201, 'Registration successful', {
      user: newUser.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // Find user with password selected explicitly
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const token = generateToken(user);

    return sendSuccess(res, 200, 'Login successful', {
      user: user.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Authenticated user', {
    user: req.user.toJSON()
  });
};

module.exports = {
  register,
  login,
  getMe
};
