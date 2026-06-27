const express = require('express');
const router = express.Router();
const {
  addComment,
  getCommentsByIssue,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Mount protect middleware on all comment endpoints
router.use(protect);

router.post('/', addComment);
router.get('/:issueId', getCommentsByIssue);
router.delete('/:id', deleteComment);

module.exports = router;
