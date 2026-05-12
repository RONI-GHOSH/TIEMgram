const express = require('express');
const router = express.Router();
const { searchUsers, findExactUser } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/users', searchUsers);
router.get('/users/exact', findExactUser);

module.exports = router;
