const express = require('express');
const router = express.Router();
const {
  supportIssue,
  removeSupport,
  getSupportCount
} = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

// Mount protect middleware on all support endpoints
router.use(protect);

// More specific route must come first
router.get('/:issueId/count', getSupportCount);

router
  .route('/:issueId')
  .post(supportIssue)
  .delete(removeSupport);

module.exports = router;
