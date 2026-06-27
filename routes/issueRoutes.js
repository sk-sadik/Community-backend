const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Mount protect middleware on all issue endpoints
router.use(protect);

router
  .route('/')
  .post(upload.single('image'), createIssue)
  .get(getIssues);

router
  .route('/:id')
  .get(getIssueById)
  .put(upload.single('image'), updateIssue)
  .delete(deleteIssue);

module.exports = router;
