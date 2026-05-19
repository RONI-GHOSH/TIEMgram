const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');
const asyncHandler = require('express-async-handler');

// @desc    Reset database and populate dummy data
// @route   POST /api/v1/db/reset
// @access  Public (No auth needed)
const resetDatabase = asyncHandler(async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the complete schema.sql file content raw
    await sequelize.query(sql);
    
    res.status(200).json({
      success: true,
      message: 'Database reset and dummy data populated successfully!'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to reset database: ${error.message}`);
  }
});

module.exports = { resetDatabase };
