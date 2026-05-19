const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const register = asyncHandler(async (req, res) => {
  const { email, password, username, full_name, department, year, semester } = req.body.body || req.body;

  const userExists = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email or username');
  }

  const otp = '1111';
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes


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
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Verify your TIEMgram account',
    //   message: `Your OTP for registration is: ${otp}. It expires in 10 minutes.`,
    //   html: `<h1>Welcome to TIEMgram</h1><p>Your OTP for registration is: <b>${otp}</b></p>`,
    // });

    res.status(201).json({
      success: true,
      message: 'User registered. Please verify your email with the OTP sent.',
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body.body || req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpires < new Date()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;

  const accessToken = generateAccessToken(user.id);
  const refreshTokenValue = generateRefreshToken(user.id);

  user.refreshToken = refreshTokenValue;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      access_token: accessToken,
      refresh_token: refreshTokenValue,
    },
  });
});


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body.body || req.body;

  const user = await User.findOne({ where: { email } });

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email before logging in');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user.id,
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

const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body.body || req.body;

  if (!refresh_token) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  const user = await User.findOne({ where: { refreshToken: refresh_token } });

  if (!user) {
    res.status(403);
    throw new Error('Invalid refresh token');
  }

  try {
    jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

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


const logout = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body.body || req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('User with this email does not exist');
  }

  const otp = '1111';
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // await sendEmail({
  //   email: user.email,
  //   subject: 'Password Reset OTP',
  //   message: `Your OTP for password reset is: ${otp}.`,
  // });

  res.status(200).json({ success: true, message: 'OTP sent to email' });
});


const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, new_password } = req.body.body || req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpires < new Date()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = new_password;
  user.otp = null;
  user.otpExpires = null;
  user.refreshToken = null;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful' });
});

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
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
