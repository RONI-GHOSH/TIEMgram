const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const User = require('../models/User');

// @desc    Search users (fuzzy name / username)
// @route   GET /api/v1/search/users
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { full_name: { [Op.iLike]: `%${q}%` } }
      ]
    },
    attributes: ['username', 'full_name', 'avatar_url', 'department', 'year'],
    limit: 20
  });

  res.json({
    success: true,
    data: users
  });
});

// @desc    Find user by exact username
// @route   GET /api/v1/search/users/exact
// @access  Private
const findExactUser = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username) {
    res.status(400);
    throw new Error('Username is required');
  }

  const user = await User.findOne({
    where: { username },
    attributes: ['username', 'full_name', 'avatar_url', 'department', 'year', 'is_private']
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

module.exports = {
  searchUsers,
  findExactUser
};
