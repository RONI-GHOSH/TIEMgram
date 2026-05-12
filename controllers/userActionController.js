const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Block = require('../models/Block');
const { Op } = require('sequelize');

// @desc    Follow a user
// @route   POST /api/v1/users/:username/follow
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser.id === req.user.id) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  // Check if blocked
  const isBlocked = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: req.user.id, blockedId: targetUser.id },
        { blockerId: targetUser.id, blockedId: req.user.id }
      ]
    }
  });

  if (isBlocked) {
    res.status(403);
    throw new Error('Action not allowed');
  }

  // Check if already following
  const existingFollow = await Follow.findOne({
    where: { followerId: req.user.id, followingId: targetUser.id }
  });

  if (existingFollow) {
    res.status(400);
    throw new Error('Already following or request pending');
  }

  // If target user is private, set status to pending
  const status = targetUser.is_private ? 'pending' : 'accepted';

  await Follow.create({
    followerId: req.user.id,
    followingId: targetUser.id,
    status
  });

  res.status(200).json({
    success: true,
    message: status === 'pending' ? 'Follow request sent' : 'User followed'
  });
});

// @desc    Unfollow a user
// @route   DELETE /api/v1/users/:username/follow
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const follow = await Follow.findOne({
    where: { followerId: req.user.id, followingId: targetUser.id }
  });

  if (!follow) {
    res.status(400);
    throw new Error('You are not following this user');
  }

  await follow.destroy();

  res.status(200).json({ success: true, message: 'User unfollowed' });
});

// @desc    Accept follow request
// @route   POST /api/v1/users/:username/follow/accept
// @access  Private
const acceptFollowRequest = asyncHandler(async (req, res) => {
  const requester = await User.findOne({ where: { username: req.params.username } });

  if (!requester) {
    res.status(404);
    throw new Error('User not found');
  }

  const follow = await Follow.findOne({
    where: { followerId: requester.id, followingId: req.user.id, status: 'pending' }
  });

  if (!follow) {
    res.status(404);
    throw new Error('Follow request not found');
  }

  follow.status = 'accepted';
  await follow.save();

  res.status(200).json({ success: true, message: 'Follow request accepted' });
});

// @desc    Reject follow request
// @route   DELETE /api/v1/users/:username/follow/reject
// @access  Private
const rejectFollowRequest = asyncHandler(async (req, res) => {
  const requester = await User.findOne({ where: { username: req.params.username } });

  if (!requester) {
    res.status(404);
    throw new Error('User not found');
  }

  const follow = await Follow.findOne({
    where: { followerId: requester.id, followingId: req.user.id, status: 'pending' }
  });

  if (!follow) {
    res.status(404);
    throw new Error('Follow request not found');
  }

  await follow.destroy();

  res.status(200).json({ success: true, message: 'Follow request rejected' });
});

// @desc    Get followers list
// @route   GET /api/v1/users/:username/followers
// @access  Private
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const follows = await Follow.findAll({
    where: { followingId: user.id, status: 'accepted' },
    // Ideally we would join with User model here, but keeping it simple as requested
  });

  // Fetch user details for each follower
  const followerIds = follows.map(f => f.followerId);
  const followers = await User.findAll({
    where: { id: followerIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });

  res.json({ success: true, data: followers });
});

// @desc    Get following list
// @route   GET /api/v1/users/:username/following
// @access  Private
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const follows = await Follow.findAll({
    where: { followerId: user.id, status: 'accepted' }
  });

  const followingIds = follows.map(f => f.followingId);
  const following = await User.findAll({
    where: { id: followingIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });

  res.json({ success: true, data: following });
});

// @desc    Block a user
// @route   POST /api/v1/users/:username/block
// @access  Private
const blockUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser.id === req.user.id) {
    res.status(400);
    throw new Error('You cannot block yourself');
  }

  const existingBlock = await Block.findOne({
    where: { blockerId: req.user.id, blockedId: targetUser.id }
  });

  if (existingBlock) {
    res.status(400);
    throw new Error('User already blocked');
  }

  await Block.create({ blockerId: req.user.id, blockedId: targetUser.id });

  // Remove any existing follow relationships
  await Follow.destroy({
    where: {
      [Op.or]: [
        { followerId: req.user.id, followingId: targetUser.id },
        { followerId: targetUser.id, followingId: req.user.id }
      ]
    }
  });

  res.status(200).json({ success: true, message: 'User blocked' });
});

// @desc    Unblock a user
// @route   DELETE /api/v1/users/:username/block
// @access  Private
const unblockUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findOne({ where: { username: req.params.username } });

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const block = await Block.findOne({
    where: { blockerId: req.user.id, blockedId: targetUser.id }
  });

  if (!block) {
    res.status(400);
    throw new Error('User not blocked');
  }

  await block.destroy();

  res.status(200).json({ success: true, message: 'User unblocked' });
});

// @desc    Get my blocked list
// @route   GET /api/v1/users/me/blocked
// @access  Private
const getBlockedList = asyncHandler(async (req, res) => {
  const blocks = await Block.findAll({ where: { blockerId: req.user.id } });
  const blockedIds = blocks.map(b => b.blockedId);
  const blockedUsers = await User.findAll({
    where: { id: blockedIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });

  res.json({ success: true, data: blockedUsers });
});

// @desc    Get pending follow requests
// @route   GET /api/v1/users/me/follow-requests
// @access  Private
const getPendingRequests = asyncHandler(async (req, res) => {
  const follows = await Follow.findAll({
    where: { followingId: req.user.id, status: 'pending' }
  });

  const requesterIds = follows.map(f => f.followerId);
  const requesters = await User.findAll({
    where: { id: requesterIds },
    attributes: ['username', 'full_name', 'avatar_url']
  });

  res.json({ success: true, data: requesters });
});

module.exports = {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedList,
  getPendingRequests,
};
