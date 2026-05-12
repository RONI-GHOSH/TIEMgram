const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedList,
  getPendingRequests,
} = require('../controllers/userActionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Me routes
router.get('/me/blocked', getBlockedList);
router.get('/me/follow-requests', getPendingRequests);

// Username specific routes
router.post('/:username/follow', followUser);
router.delete('/:username/follow', unfollowUser);
router.post('/:username/follow/accept', acceptFollowRequest);
router.delete('/:username/follow/reject', rejectFollowRequest);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
router.post('/:username/block', blockUser);
router.delete('/:username/block', unblockUser);

module.exports = router;
