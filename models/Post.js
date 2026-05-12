const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Post = sequelize.define('Post', {
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
  caption: {
    type: DataTypes.TEXT,
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'text'),
    defaultValue: 'text',
  },
  location: {
    type: DataTypes.STRING,
  },
  tags: {
    type: DataTypes.JSONB, // PostgreSQL specific for efficient JSON storage
    defaultValue: [],
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = Post;
