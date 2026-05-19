const express = require('express');
const router = express.Router();
const {
  createStory,
  getActiveStories,
  deleteStory,
  viewStory,
  getStoryViewers
} = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPostMedia } = require('../config/cloudinary');

// All story routes are protected
router.use(protect);

router.post('/', uploadPostMedia.single('media'), createStory);
router.get('/', getActiveStories);
router.delete('/:story_id', deleteStory);
router.post('/:story_id/view', viewStory);
router.get('/:story_id/viewers', getStoryViewers);

module.exports = router;
