const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Story = sequelize.define('Story', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'text', 'sticker'),
    allowNull: false,
    defaultValue: 'text',
  },
  text_content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  text_color: {
    type: DataTypes.STRING,
    defaultValue: '#FFFFFF',
  },
  background_color: {
    type: DataTypes.STRING,
    defaultValue: '#E91E8C',
  },
  sticker_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  audience: {
    type: DataTypes.ENUM('public', 'followers', 'close_friends'),
    defaultValue: 'public',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  hooks: {
    beforeValidate: (story) => {
      if (!story.expiresAt) {
        const now = new Date();
        story.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      }
    }
  },
  timestamps: true,
});

module.exports = Story;
