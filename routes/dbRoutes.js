const express = require('express');
const router = express.Router();
const { resetDatabase } = require('../controllers/dbController');

// POST /api/v1/db/reset -> Public endpoint to drop, recreate, and seed all tables
router.post('/reset', resetDatabase);

module.exports = router;
