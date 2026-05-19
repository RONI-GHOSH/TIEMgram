const express = require('express');
const router = express.Router();
const {
  createPost,
  getPost,
  getUserPosts,
  editPost,
  deletePost,
  likePost,
  unlikePost,
  getPostLikes,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPostMedia } = require('../config/cloudinary');

router.use(protect);

router.post('/', uploadPostMedia.array('media', 10), createPost);
router.get('/:post_id', getPost);
router.patch('/:post_id', uploadPostMedia.array('media', 10), editPost);
router.delete('/:post_id', deletePost);

// Like routes
router.post('/:post_id/like', likePost);
router.delete('/:post_id/like', unlikePost);
router.get('/:post_id/likes', getPostLikes);

module.exports = router;
