const User = require('./User');
const Post = require('./Post');
const PostMedia = require('./PostMedia');
const Like = require('./Like');
const Follow = require('./Follow');
const Block = require('./Block');
const Story = require('./Story');
const StoryView = require('./StoryView');

// User <-> Post
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Post <-> PostMedia
Post.hasMany(PostMedia, { foreignKey: 'postId' });
PostMedia.belongsTo(Post, { foreignKey: 'postId' });

// Post <-> Like
Post.hasMany(Like, { foreignKey: 'postId' });
Like.belongsTo(Post, { foreignKey: 'postId' });

// User <-> Like
User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });

// User <-> Follow (Self-referential)
User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId', otherKey: 'followerId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId', otherKey: 'followingId' });

// User <-> Block (Self-referential)
User.belongsToMany(User, { as: 'BlockedUsers', through: Block, foreignKey: 'blockerId', otherKey: 'blockedId' });

// User <-> Story
User.hasMany(Story, { foreignKey: 'userId' });
Story.belongsTo(User, { foreignKey: 'userId' });

// Story <-> StoryView
Story.hasMany(StoryView, { foreignKey: 'storyId', onDelete: 'CASCADE' });
StoryView.belongsTo(Story, { foreignKey: 'storyId' });

// User <-> StoryView
User.hasMany(StoryView, { foreignKey: 'userId', onDelete: 'CASCADE' });
StoryView.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Post, PostMedia, Like, Follow, Block, Story, StoryView };
