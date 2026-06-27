const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const Support = require('../models/Support');

// Helper to delete an image file from the system
const deleteImageFile = (relativeFilePath) => {
  if (!relativeFilePath) return;
  const absolutePath = path.join(__dirname, '..', relativeFilePath);
  fs.unlink(absolutePath, (err) => {
    if (err) {
      console.error(`Failed to delete file at ${absolutePath}:`, err.message);
    }
  });
};

// @desc    View all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and their associated comments/support
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${req.params.id}`
      });
    }

    // Do not allow deleting own admin profile this way
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    // Clean up user activity
    await Comment.deleteMany({ user: user._id });
    await Support.deleteMany({ user: user._id });

    // Clean up issues reported by this user (including files)
    const userIssues = await Issue.find({ reportedBy: user._id });
    for (const issue of userIssues) {
      deleteImageFile(issue.image);
      await Comment.deleteMany({ issue: issue._id });
      await Support.deleteMany({ issue: issue._id });
      await issue.deleteOne();
    }

    // Delete user profile
    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'User and all associated reported issues/activity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View all issues in system
// @route   GET /api/admin/issues
// @access  Private/Admin
exports.getAllIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find()
      .populate('reportedBy', 'name email phone profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any issue
// @route   DELETE /api/admin/issues/:id
// @access  Private/Admin
exports.deleteIssueByAdmin = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${req.params.id}`
      });
    }

    // Delete image file
    deleteImageFile(issue.image);

    // Delete related comments & support
    await Comment.deleteMany({ issue: issue._id });
    await Support.deleteMany({ issue: issue._id });

    // Delete issue
    await issue.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Issue and associated comments/support deleted successfully by admin'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status
// @route   PUT /api/admin/issues/:id/status
// @access  Private/Admin
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      'Pending',
      'Verified',
      'Assigned',
      'In Progress',
      'Resolved',
      'Rejected'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email phone profileImage');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Issue status updated successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: 'Pending' });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

    // Category-wise count breakdown
    const categoryBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format category-wise counts with zero defaults for all valid categories
    const categories = [
      'Road',
      'Municipal',
      'Electrical',
      'Garbage',
      'Drainage',
      'Water Supply',
      'Street Light',
      'Public Property',
      'Others'
    ];

    const categoryWiseCount = {};
    categories.forEach((cat) => {
      categoryWiseCount[cat] = 0;
    });

    categoryBreakdown.forEach((group) => {
      if (group._id && categoryWiseCount[group._id] !== undefined) {
        categoryWiseCount[group._id] = group.count;
      } else if (group._id) {
        categoryWiseCount[group._id] = group.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalIssues,
        pendingIssues,
        resolvedIssues,
        categoryWiseCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (promote/demote)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${req.params.id}`
      });
    }

    // Do not allow updating own role to avoid self-lockout/self-demotion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated successfully to ${role}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

