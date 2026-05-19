const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'resumeai-pro-dev-secret' : null);

const generateToken = (id) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Set it in backend/.env.');
  }

  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = String(req.body.role || '').toLowerCase();
    const adminKey = req.body.adminKey || req.body.adminkey;
    const isAdminSignup = role === 'admin';

    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email, and password are required.');
    }

    if (isAdminSignup && adminKey !== process.env.ADMIN_SIGNUP_KEY) {
      return sendError(res, 403, 'Admin signup is not allowed without a valid admin key.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: isAdminSignup ? 'admin' : 'user',
    });
    const token = generateToken(user._id);

    return sendSuccess(res, 201, 'Account created successfully.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        uploadCount: user.uploadCount,
      },
    });
  } catch (error) {
    console.error('Register error:', error.stack || error);
    return sendError(res, 500, error.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        uploadCount: user.uploadCount,
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return sendSuccess(res, 200, 'Profile fetched.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        uploadCount: user.uploadCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (name) user.name = name;
    if (password) {
      if (password.length < 6) return sendError(res, 400, 'Password must be at least 6 characters.');
      user.password = password;
    }

    await user.save();
    return sendSuccess(res, 200, 'Profile updated successfully.', {
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { register, login, getProfile, updateProfile };
