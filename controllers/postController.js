const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const PostMedia = require('../models/PostMedia');
const Like = require('../models/Like');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Block = require('../models/Block');
const { Op } = require('sequelize');

// Helper to parse privacy option from tags and clean them
const cleanPostTagsAndGetPrivacy = (post) => {
  if (!post) return null;
  const postJson = typeof post.toJSON === 'function' ? post.toJSON() : post;
  
  const tags = Array.isArray(postJson.tags) ? postJson.tags : [];
  let privacy = 'public';
  
  if (tags.includes('_privacy:private')) {
    privacy = 'private';
    postJson.tags = tags.filter(t => t !== '_privacy:private');
  } else if (!postJson.is_public) {
    privacy = 'followers-following-only';
  }
  
  postJson.privacy = privacy;
  return postJson;
};

// Helper to determine if a post is private before loading full model
const getPostPrivacy = (post) => {
  if (!post) return 'public';
  const tags = Array.isArray(post.tags) ? post.tags : [];
  if (tags.includes('_privacy:private')) {
    return 'private';
  }
  return post.is_public ? 'public' : 'followers-following-only';
};

const createPost = asyncHandler(async (req, res) => {
  const { caption, type, location, tags, is_public, privacy } = req.body;

  let parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
  if (!Array.isArray(parsedTags)) {
    parsedTags = [];
  }

  let isPublicValue = true;
  if (privacy !== undefined) {
    if (privacy === 'private') {
      isPublicValue = false;
      if (!parsedTags.includes('_privacy:private')) {
        parsedTags.push('_privacy:private');
      }
    } else if (privacy === 'followers-following-only' || privacy === 'followers') {
      isPublicValue = false;
      parsedTags = parsedTags.filter(t => t !== '_privacy:private');
    } else {
      isPublicValue = true;
      parsedTags = parsedTags.filter(t => t !== '_privacy:private');
    }
  } else if (is_public !== undefined) {
    const isPub = is_public === 'false' || is_public === false ? false : true;
    isPublicValue = isPub;
    parsedTags = parsedTags.filter(t => t !== '_privacy:private');
  }

  const post = await Post.create({
    userId: req.user.id,
    caption,
    type,
    location,
    tags: parsedTags,
    is_public: isPublicValue,
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
    data: cleanPostTagsAndGetPrivacy(fullPost)
  });
});

const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findByPk(req.params.post_id, {
    include: [
      { model: User, attributes: ['username', 'full_name', 'avatar_url', 'is_private'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ]
  });

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const privacy = getPostPrivacy(post);
  const isCreator = post.userId === req.user.id;

  if (!isCreator) {
    if (privacy === 'private') {
      res.status(403);
      throw new Error('This post is private');
    }

    if (privacy === 'followers-following-only') {
      const isFollowingOrFollowed = await Follow.findOne({
        where: {
          [Op.or]: [
            { followerId: req.user.id, followingId: post.userId, status: 'accepted' },
            { followerId: post.userId, followingId: req.user.id, status: 'accepted' }
          ]
        }
      });
      if (!isFollowingOrFollowed) {
        res.status(403);
        throw new Error('This post is restricted to followers/following');
      }
    }
  }

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

  const postJson = cleanPostTagsAndGetPrivacy(post);
  postJson.likes_count = post.Likes ? post.Likes.length : 0;
  postJson.is_liked = post.Likes ? post.Likes.some(like => like.userId === req.user.id) : false;
  delete postJson.Likes;

  res.json({ success: true, data: postJson });
});

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
    const isFollowingOrFollowed = await Follow.findOne({
      where: {
        [Op.or]: [
          { followerId: req.user.id, followingId: user.id, status: 'accepted' },
          { followerId: user.id, followingId: req.user.id, status: 'accepted' }
        ]
      }
    });

    if (isFollowingOrFollowed) {
      whereClause[Op.and] = [
        {
          [Op.not]: {
            tags: {
              [Op.contains]: ['_privacy:private']
            }
          }
        }
      ];
    } else {
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
    const postJson = cleanPostTagsAndGetPrivacy(post);
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

  const { caption, type, location, tags, is_public, privacy } = req.body;
  if (caption !== undefined) post.caption = caption;
  if (type !== undefined) post.type = type;
  if (location !== undefined) post.location = location;

  let parsedTags = tags !== undefined 
    ? (tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []) 
    : (post.tags || []);
  if (!Array.isArray(parsedTags)) {
    parsedTags = [];
  }

  let isPublicValue = post.is_public;
  if (privacy !== undefined) {
    if (privacy === 'private') {
      isPublicValue = false;
      if (!parsedTags.includes('_privacy:private')) {
        parsedTags.push('_privacy:private');
      }
    } else if (privacy === 'followers-following-only' || privacy === 'followers') {
      isPublicValue = false;
      parsedTags = parsedTags.filter(t => t !== '_privacy:private');
    } else {
      isPublicValue = true;
      parsedTags = parsedTags.filter(t => t !== '_privacy:private');
    }
  } else if (is_public !== undefined) {
    const isPub = is_public === 'false' || is_public === false ? false : true;
    isPublicValue = isPub;
    parsedTags = parsedTags.filter(t => t !== '_privacy:private');
  }

  post.tags = parsedTags;
  post.is_public = isPublicValue;

  // Handle media updates if new files are uploaded
  if (req.files && req.files.length > 0) {
    // Delete existing post media from DB
    await PostMedia.destroy({ where: { postId: post.id } });
    
    // Create new post media entries
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

  await post.save();

  const fullPost = await Post.findByPk(post.id, {
    include: [{ model: PostMedia }]
  });

  res.json({ success: true, data: cleanPostTagsAndGetPrivacy(fullPost) });
});


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


const getPostLikes = asyncHandler(async (req, res) => {
  const likes = await Like.findAll({
    where: { postId: req.params.post_id },
    include: [{ model: User, attributes: ['username', 'full_name', 'avatar_url'] }]
  });

  res.json({
    success: true,
    likes_count: likes.length,
    count: likes.length,
    data: likes.map(l => l.User)
  });
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
