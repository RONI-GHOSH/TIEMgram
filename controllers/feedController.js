const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const PostMedia = require('../models/PostMedia');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const { Op } = require('sequelize');

// @desc    Get home feed
// @route   GET /api/v1/feed
// @access  Private
const getHomeFeed = asyncHandler(async (req, res) => {
  // 1. Get IDs of users being followed
  const following = await Follow.findAll({
    where: { followerId: req.user.id, status: 'accepted' },
    attributes: ['followingId']
  });

  const followingIds = following.map(f => f.followingId);
  // Include own ID
  followingIds.push(req.user.id);

  // 2. Fetch posts from these users
  const posts = await Post.findAll({
    where: {
      userId: { [Op.in]: followingIds }
    },
    include: [
      { model: User, attributes: ['username', 'full_name', 'avatar_url'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 20
  });

  // 3. Add 'isLiked' property to each post for the UI
  const postsWithLikedStatus = posts.map(post => {
    const postJson = post.toJSON();
    postJson.likes_count = post.Likes.length;
    postJson.is_liked = post.Likes.some(like => like.userId === req.user.id);
    delete postJson.Likes; // Clean up the likes array
    return postJson;
  });

  res.json({
    success: true,
    data: postsWithLikedStatus
  });
});

module.exports = { getHomeFeed };
