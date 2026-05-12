const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { email, password, username, full_name, department, year, semester } = req.body.body || req.body;

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email or username');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Create user (not verified yet)
  const user = await User.create({
    username,
    email,
    password,
    full_name,
    department,
    year,
    semester,
    otp,
    otpExpires,
  });

  if (user) {
    // Send OTP Email
    await sendEmail({
      email: user.email,
      subject: 'Verify your TIEMgram account',
      message: `Your OTP for registration is: ${otp}. It expires in 10 minutes.`,
      html: `<h1>Welcome to TIEMgram</h1><p>Your OTP for registration is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
    });

    res.status(201).json({
      success: true,
      message: 'User registered. Please verify your email with the OTP sent.',
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Verify email OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body.body || req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now login.',
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body.body || req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email before logging in');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body.body || req.body;

  if (!refresh_token) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  const user = await User.findOne({ refreshToken: refresh_token });

  if (!user) {
    res.status(403);
    throw new Error('Invalid refresh token');
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(403);
    throw new Error('Expired or invalid refresh token');
  }
});

// @desc    Logout / Invalidate token
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Forgot Password - Request OTP
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body.body || req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User with this email does not exist');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmail({
    email: user.email,
    subject: 'Password Reset OTP',
    message: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p>`,
  });

  res.status(200).json({ success: true, message: 'OTP sent to email' });
});

// @desc    Reset Password with OTP
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, new_password } = req.body.body || req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = new_password;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.refreshToken = undefined; // Log out from all devices on password change
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful' });
});

// Helper: Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = {
  register,
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
