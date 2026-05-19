const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const PostMedia = require('../models/PostMedia');
const Like = require('../models/Like');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Block = require('../models/Block');
const { Op } = require('sequelize');

// @desc    Create a post
// @route   POST /api/v1/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { caption, type, location, tags, is_public } = req.body;
  
  const post = await Post.create({
    userId: req.user.id,
    caption,
    type,
    location,
    tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
    is_public: is_public === 'false' ? false : true,
  });

  if (req.files && req.files.length > 0) {
    const mediaPromises = req.files.map(file => {
      const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
      return PostMedia.create({
        postId: post.id,
        url: file.path,
        type: mediaType
      });
    });
    await Promise.all(mediaPromises);
  }

  const fullPost = await Post.findByPk(post.id, {
    include: [{ model: PostMedia }]
  });

  res.status(201).json({
    success: true,
    data: fullPost
  });
});

// @desc    Get single post
// @route   GET /api/v1/posts/:post_id
// @access  Private
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.post_id, {
    include: [
      { model: User, attributes: ['username', 'full_name', 'avatar_url', 'is_private'] },
      { model: PostMedia }
    ]
  });

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Privacy Check
  if (!post.is_public && post.userId !== req.user.id) {
    const isFollowing = await Follow.findOne({
      where: { followerId: req.user.id, followingId: post.userId, status: 'accepted' }
    });
    if (!isFollowing) {
      res.status(403);
      throw new Error('This post is private');
    }
  }

  // Block Check
  const isBlocked = await Block.findOne({
    where: {
        [Op.or]: [
            { blockerId: req.user.id, blockedId: post.userId },
            { blockerId: post.userId, blockedId: req.user.id }
        ]
    }
  });

  if (isBlocked) {
    res.status(403);
    throw new Error('Action not allowed');
  }

  res.json({ success: true, data: post });
});

// @desc    List posts by user
// @route   GET /api/v1/users/:username/posts
// @access  Private
const getUserPosts = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Block check
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
    throw new Error('Action not allowed');
  }

  let whereClause = { userId: user.id };

  if (user.id !== req.user.id) {
    const isFollowing = await Follow.findOne({
      where: { followerId: req.user.id, followingId: user.id, status: 'accepted' }
    });
    
    if (!isFollowing) {
      whereClause.is_public = true;
    }
  }

  // Parse pagination query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Parse sort parameter ('time' or 'likes')
  const sort = req.query.sort || 'time';

  const posts = await Post.findAll({
    where: whereClause,
    include: [
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ]
  });

  const formattedPosts = posts.map(post => {
    const postJson = post.toJSON();
    postJson.likes_count = post.Likes ? post.Likes.length : 0;
    postJson.is_liked = post.Likes ? post.Likes.some(like => like.userId === req.user.id) : false;
    delete postJson.Likes;
    return postJson;
  });

  if (sort === 'likes') {
    formattedPosts.sort((a, b) => b.likes_count - a.likes_count);
  } else {
    formattedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const paginatedPosts = formattedPosts.slice(offset, offset + limit);

  res.json({
    success: true,
    page,
    limit,
    total: formattedPosts.length,
    data: paginatedPosts
  });
});

// @desc    Edit post
// @route   PATCH /api/v1/posts/:post_id
// @access  Private
const editPost = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.post_id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (post.userId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to edit this post');
  }

  const { caption, is_public, tags } = req.body;
  if (caption) post.caption = caption;
  if (is_public !== undefined) post.is_public = is_public;
  if (tags) post.tags = tags;

  await post.save();

  res.json({ success: true, data: post });
});

// @desc    Delete post
// @route   DELETE /api/v1/posts/:post_id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.post_id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (post.userId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this post');
  }

  await post.destroy();
  res.json({ success: true, message: 'Post removed' });
});

// @desc    Like a post
// @route   POST /api/v1/posts/:post_id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.post_id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  try {
    await Like.create({
        userId: req.user.id,
        postId: post.id
      });
      res.status(200).json({ success: true, message: 'Post liked' });
  } catch (error) {
    res.status(400);
    throw new Error('Post already liked');
  }
});

// @desc    Unlike a post
// @route   DELETE /api/v1/posts/:post_id/like
// @access  Private
const unlikePost = asyncHandler(async (req, res) => {
  const like = await Like.findOne({
    where: { userId: req.user.id, postId: req.params.post_id }
  });

  if (!like) {
    res.status(400);
    throw new Error('Post not liked yet');
  }

  await like.destroy();
  res.json({ success: true, message: 'Post unliked' });
});

// @desc    Get post likers
// @route   GET /api/v1/posts/:post_id/likes
// @access  Private
const getPostLikes = asyncHandler(async (req, res) => {
  const likes = await Like.findAll({
    where: { postId: req.params.post_id },
    include: [{ model: User, attributes: ['username', 'full_name', 'avatar_url'] }]
  });

  res.json({ success: true, data: likes.map(l => l.User) });
});

module.exports = {
  createPost,
  getPost,
  getUserPosts,
  editPost,
  deletePost,
  likePost,
  unlikePost,
  getPostLikes,
};
