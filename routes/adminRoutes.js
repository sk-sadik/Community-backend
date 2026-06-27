const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  getAllIssues,
  deleteIssueByAdmin,
  updateIssueStatus,
  getDashboardStats,
  updateUserRole
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Mount authentication and administrator validation on all admin endpoints
router.use(protect);
router.use(admin);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);

router.get('/issues', getAllIssues);
router.delete('/issues/:id', deleteIssueByAdmin);
router.put('/issues/:id/status', updateIssueStatus);

router.get('/dashboard', getDashboardStats);

module.exports = router;

