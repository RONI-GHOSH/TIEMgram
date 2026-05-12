const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  getPublicProfile,
  getProfileStats,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// All profile routes are protected
router.use(protect);

router.get('/me', getMyProfile);
router.patch('/me', updateProfile);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', removeAvatar);

router.get('/:username', getPublicProfile);
router.get('/:username/stats', getProfileStats);

module.exports = router;
