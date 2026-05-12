const express = require('express');
const router = express.Router();
const { getHomeFeed } = require('../controllers/feedController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getHomeFeed);

module.exports = router;
