const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StoryView = sequelize.define('StoryView', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Stories',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['storyId', 'userId']
    }
  ]
});

module.exports = StoryView;
