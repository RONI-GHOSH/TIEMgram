const asyncHandler = require('express-async-handler');
const { Post, PostMedia, User, Follow, Like, Block } = require('../models/associations');
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

const getHomeFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  const blocks = await Block.findAll({
    where: {
      [Op.or]: [
        { blockerId: req.user.id },
        { blockedId: req.user.id }
      ]
    }
  });
  const blockedIds = blocks.map(b => b.blockerId === req.user.id ? b.blockedId : b.blockerId);

  const followed = await Follow.findAll({
    where: { followerId: req.user.id, status: 'accepted' },
    attributes: ['followingId']
  });
  const followedIds = followed.map(f => f.followingId);
  const allowedFollowedIds = [req.user.id, ...followedIds].filter(id => !blockedIds.includes(id));


  const recentFollowerPosts = await Post.findAll({
    where: {
      [Op.or]: [
        { userId: req.user.id },
        {
          userId: { [Op.in]: followedIds.filter(id => !blockedIds.includes(id)) },
          [Op.not]: {
            tags: {
              [Op.contains]: ['_privacy:private']
            }
          }
        }
      ],
      createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    include: [
      { model: User, attributes: ['username', 'full_name', 'avatar_url'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  const olderFollowerPosts = await Post.findAll({
    where: {
      [Op.or]: [
        { userId: req.user.id },
        {
          userId: { [Op.in]: followedIds.filter(id => !blockedIds.includes(id)) },
          [Op.not]: {
            tags: {
              [Op.contains]: ['_privacy:private']
            }
          }
        }
      ],
      createdAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    include: [
      { model: User, attributes: ['username', 'full_name', 'avatar_url'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ]
  });

  olderFollowerPosts.sort((a, b) => b.Likes.length - a.Likes.length);

  const combinedFollowers = [...recentFollowerPosts, ...olderFollowerPosts];
  const followerSlice = combinedFollowers.slice((page - 1) * 14, (page - 1) * 14 + 14);
  const platformRecent = await Post.findAll({
    where: {
      is_public: true,
      [Op.not]: {
        tags: {
          [Op.contains]: ['_privacy:private']
        }
      },
      userId: { [Op.notIn]: [...blockedIds, ...allowedFollowedIds] }
    },
    include: [
      { model: User, where: { is_private: false }, attributes: ['username', 'full_name', 'avatar_url'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  const platformRecentSlice = platformRecent.slice((page - 1) * 2, (page - 1) * 2 + 2);
  const platformBest = await Post.findAll({
    where: {
      is_public: true,
      [Op.not]: {
        tags: {
          [Op.contains]: ['_privacy:private']
        }
      },
      userId: { [Op.notIn]: [...blockedIds, ...allowedFollowedIds] }
    },
    include: [
      { model: User, where: { is_private: false }, attributes: ['username', 'full_name', 'avatar_url'] },
      { model: PostMedia },
      { model: Like, attributes: ['userId'] }
    ]
  });

  platformBest.sort((a, b) => b.Likes.length - a.Likes.length);
  const platformBestSlice = platformBest.slice((page - 1) * 4, (page - 1) * 4 + 4);

  let mixedFeed = [...followerSlice, ...platformRecentSlice, ...platformBestSlice];

  for (let i = mixedFeed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixedFeed[i], mixedFeed[j]] = [mixedFeed[j], mixedFeed[i]];
  }
  const finalFeed = mixedFeed.map(post => {
    const postJson = cleanPostTagsAndGetPrivacy(post);
    postJson.likes_count = post.Likes ? post.Likes.length : 0;
    postJson.is_liked = post.Likes ? post.Likes.some(like => like.userId === req.user.id) : false;
    delete postJson.Likes;
    return postJson;
  });

  res.json({
    success: true,
    data: finalFeed
  });
});

module.exports = { getHomeFeed };
