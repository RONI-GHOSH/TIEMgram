const asyncHandler = require('express-async-handler');
const { Story, StoryView, User, Follow, Block } = require('../models/associations');
const { Op } = require('sequelize');

// @desc    Create a story
// @route   POST /api/v1/stories
// @access  Private
const createStory = asyncHandler(async (req, res) => {
  const { type, text_content, text_color, background_color, sticker_id, duration_seconds, audience } = req.body;

  // Validate type
  const allowedTypes = ['image', 'video', 'text', 'sticker'];
  if (type && !allowedTypes.includes(type)) {
    res.status(400);
    throw new Error('Invalid story type. Must be image, video, text, or sticker');
  }

  // If type is image or video, media file is required
  if ((type === 'image' || type === 'video') && !req.file) {
    res.status(400);
    throw new Error(`Media file is required for type '${type}'`);
  }

  // Validate audience
  const allowedAudiences = ['public', 'followers', 'close_friends'];
  if (audience && !allowedAudiences.includes(audience)) {
    res.status(400);
    throw new Error('Invalid audience. Must be public, followers, or close_friends');
  }

  // Uploaded media url
  const mediaUrl = req.file ? req.file.path : null;

  const story = await Story.create({
    userId: req.user.id,
    mediaUrl,
    type: type || 'text',
    text_content,
    text_color: text_color || '#FFFFFF',
    background_color: background_color || '#E91E8C',
    sticker_id,
    duration_seconds: duration_seconds ? parseInt(duration_seconds) : 5,
    audience: audience || 'public',
  });

  res.status(201).json({
    success: true,
    data: story
  });
});

// @desc    Get active stories of followed users and self
// @route   GET /api/v1/stories
// @access  Private
const getActiveStories = asyncHandler(async (req, res) => {
  // 1. Get block list (either blocker or blocked)
  const blocks = await Block.findAll({
    where: {
      [Op.or]: [
        { blockerId: req.user.id },
        { blockedId: req.user.id }
      ]
    }
  });

  const blockedUserIds = blocks.map(b => b.blockerId === req.user.id ? b.blockedId : b.blockerId);

  // 2. Get accepted followed users
  const followed = await Follow.findAll({
    where: {
      followerId: req.user.id,
      status: 'accepted'
    },
    attributes: ['followingId']
  });

  const followedIds = followed.map(f => f.followingId);

  // Allowed users: self + followed users
  const allowedUserIds = [req.user.id, ...followedIds].filter(id => !blockedUserIds.includes(id));

  // 3. Fetch active stories
  const stories = await Story.findAll({
    where: {
      expiresAt: { [Op.gt]: new Date() },
      userId: { [Op.in]: allowedUserIds }
    },
    include: [
      {
        model: User,
        attributes: ['username', 'full_name', 'avatar_url', 'is_private']
      },
      {
        model: StoryView,
        where: { userId: req.user.id },
        required: false
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Format stories with is_viewed status
  const formattedStories = stories.map(story => {
    const storyJson = story.toJSON();
    storyJson.is_viewed = story.StoryViews && story.StoryViews.length > 0;
    delete storyJson.StoryViews;
    return storyJson;
  });

  res.json({
    success: true,
    data: formattedStories
  });
});

// @desc    Delete a story
// @route   DELETE /api/v1/stories/:story_id
// @access  Private
const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findByPk(req.params.story_id);

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  if (story.userId !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this story');
  }

  await story.destroy();

  res.json({
    success: true,
    message: 'Story removed successfully'
  });
});

// @desc    Mark story as viewed
// @route   POST /api/v1/stories/:story_id/view
// @access  Private
const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findByPk(req.params.story_id);

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  // Check if expired
  if (new Date(story.expiresAt) <= new Date()) {
    res.status(400);
    throw new Error('Story has expired');
  }

  // Check blocks
  const blockExists = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: req.user.id, blockedId: story.userId },
        { blockerId: story.userId, blockedId: req.user.id }
      ]
    }
  });

  if (blockExists) {
    res.status(403);
    throw new Error('Action not allowed due to blocks');
  }

  // Privacy Check: if private or restricted audience, viewer must be accepted follower or creator
  if (story.userId !== req.user.id) {
    const creator = await User.findByPk(story.userId);
    if (creator.is_private || story.audience === 'followers' || story.audience === 'close_friends') {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: story.userId,
          status: 'accepted'
        }
      });

      if (!isFollowing) {
        res.status(403);
        throw new Error('You must be following this user to view their private story');
      }
    }
  }

  // Create view if it doesn't already exist
  const [view, created] = await StoryView.findOrCreate({
    where: {
      storyId: story.id,
      userId: req.user.id
    }
  });

  res.status(200).json({
    success: true,
    message: created ? 'Story marked as viewed' : 'Story already viewed'
  });
});

// @desc    Get story viewers
// @route   GET /api/v1/stories/:story_id/viewers
// @access  Private
const getStoryViewers = asyncHandler(async (req, res) => {
  const story = await Story.findByPk(req.params.story_id);

  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  // Only creator can view who viewed the story
  if (story.userId !== req.user.id) {
    res.status(403);
    throw new Error('Only the creator can view story viewers list');
  }

  const views = await StoryView.findAll({
    where: { storyId: story.id },
    include: [
      {
        model: User,
        attributes: ['id', 'username', 'full_name', 'avatar_url']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const viewers = views.map(v => ({
    user: v.User,
    viewedAt: v.createdAt
  }));

  res.json({
    success: true,
    data: viewers
  });
});

// @desc    Get active stories for a specific user
// @route   GET /api/v1/stories/user/:username
// @route   GET /api/v1/users/:username/stories
// @access  Private
const getUserActiveStories = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ where: { username } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 1. Check blocks
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

  // 2. Determine visibility logic
  let whereClause = {
    userId: user.id,
    expiresAt: { [Op.gt]: new Date() }
  };

  if (req.user.id !== user.id) {
    // Viewer is not the owner, check follow status
    const isFollowing = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId: user.id,
        status: 'accepted'
      }
    });

    if (!isFollowing) {
      if (user.is_private) {
        res.status(403);
        throw new Error('You must be following this user to view their stories');
      } else {
        // Public user, but not following, so only show public stories
        whereClause.audience = 'public';
      }
    }
  }

  // 3. Fetch stories
  const stories = await Story.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        attributes: ['username', 'full_name', 'avatar_url', 'is_private']
      },
      {
        model: StoryView,
        required: false
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // 4. Format stories with is_viewed and views_count
  const formattedStories = stories.map(story => {
    const storyJson = story.toJSON();
    storyJson.views_count = story.StoryViews ? story.StoryViews.length : 0;
    storyJson.is_viewed = story.StoryViews ? story.StoryViews.some(v => v.userId === req.user.id) : false;
    delete storyJson.StoryViews;
    return storyJson;
  });

  res.status(200).json({
    success: true,
    count: formattedStories.length,
    total: formattedStories.length,
    data: formattedStories
  });
});

module.exports = {
  createStory,
  getActiveStories,
  deleteStory,
  viewStory,
  getStoryViewers,
  getUserActiveStories
};
