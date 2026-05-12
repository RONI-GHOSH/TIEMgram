const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get own profile
// @route   GET /api/v1/profile/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'otp', 'otpExpires'] }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update own profile
// @route   PATCH /api/v1/profile/me
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, bio, department, year, semester, is_private } = req.body.body || req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update fields if provided
  if (full_name) user.full_name = full_name;
  if (bio !== undefined) user.bio = bio;
  if (department) user.department = department;
  if (year) user.year = year;
  if (semester) user.semester = semester;
  if (is_private !== undefined) user.is_private = is_private;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
        full_name: user.full_name,
        bio: user.bio,
        department: user.department,
        year: user.year,
        semester: user.semester,
        is_private: user.is_private
    }
  });
});

// @desc    Upload profile image
// @route   POST /api/v1/profile/me/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const user = await User.findByPk(req.user.id);
  
  // If user already has an avatar, we could delete the old one from Cloudinary here
  // but for simplicity we'll just update the URL

  user.avatar_url = req.file.path;
  await user.save();

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar_url: user.avatar_url
    }
  });
});

// @desc    Remove profile image
// @route   DELETE /api/v1/profile/me/avatar
// @access  Private
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user.avatar_url) {
    // Optionally delete from Cloudinary using public_id
    // But for a college project, setting to null is often enough
    user.avatar_url = null;
    await user.save();
  }

  res.json({
    success: true,
    message: 'Avatar removed successfully'
  });
});

const Block = require('../models/Block');
const { Op } = require('sequelize');

// @desc    Get public profile by username
// @route   GET /api/v1/profile/:username
// @access  Private
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { username: req.params.username },
    attributes: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'department', 'year', 'semester', 'is_private']
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if blocked
  const isBlocked = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: req.user.id, blockedId: user.id },
        { blockerId: user.id, blockedId: req.user.id }
      ]
    }
  });

  if (isBlocked) {
    res.status(403);
    throw new Error('User has blocked you or is blocked by you');
  }

  // If private, hide sensitive details if not following (following logic not yet implemented)
  // For now, just return what's allowed
  res.json({
    success: true,
    data: user
  });
});

const Follow = require('../models/Follow');

// @desc    Get quick stats
// @route   GET /api/v1/profile/:username/stats
// @access  Private
const getProfileStats = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const followersCount = await Follow.count({ where: { followingId: user.id, status: 'accepted' } });
  const followingCount = await Follow.count({ where: { followerId: user.id, status: 'accepted' } });

  res.json({
    success: true,
    data: {
      posts_count: 0, // Still 0 until posts are implemented
      followers_count: followersCount,
      following_count: followingCount
    }
  });
});

module.exports = {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  getPublicProfile,
  getProfileStats,
};
