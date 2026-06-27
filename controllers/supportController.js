const Support = require('../models/Support');
const Issue = require('../models/Issue');

// @desc    Get support count for an issue
// @route   GET /api/support/:issueId/count
// @access  Private
exports.getSupportCount = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    // Check if issue exists
    const issueExists = await Issue.findById(issueId);
    if (!issueExists) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${issueId}`
      });
    }

    // Get support count
    const supportCount = await Support.countDocuments({ issue: issueId });

    // Check if current user has supported
    const hasSupported = await Support.findOne({
      issue: issueId,
      user: req.user.id
    });

    return res.status(200).json({
      success: true,
      supportCount,
      hasSupported: !!hasSupported
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Support (upvote) an issue
// @route   POST /api/support/:issueId
// @access  Private
exports.supportIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    // Check if issue exists
    const issueExists = await Issue.findById(issueId);
    if (!issueExists) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${issueId}`
      });
    }

    // Check if user has already supported this issue
    const existingSupport = await Support.findOne({
      issue: issueId,
      user: req.user.id
    });

    if (existingSupport) {
      return res.status(400).json({
        success: false,
        message: 'You have already upvoted/supported this issue'
      });
    }

    // Cast support
    await Support.create({
      issue: issueId,
      user: req.user.id
    });

    // Get updated support count
    const supportCount = await Support.countDocuments({ issue: issueId });

    return res.status(200).json({
      success: true,
      message: 'Issue support registered successfully',
      supportCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove support (un-upvote) from an issue
// @route   DELETE /api/support/:issueId
// @access  Private
exports.removeSupport = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    // Check if issue exists
    const issueExists = await Issue.findById(issueId);
    if (!issueExists) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${issueId}`
      });
    }

    // Check if support exists
    const support = await Support.findOne({
      issue: issueId,
      user: req.user.id
    });

    if (!support) {
      return res.status(400).json({
        success: false,
        message: 'You have not supported this issue yet'
      });
    }

    // Remove support
    await support.deleteOne();

    // Get updated support count
    const supportCount = await Support.countDocuments({ issue: issueId });

    return res.status(200).json({
      success: true,
      message: 'Issue support removed successfully',
      supportCount
    });
  } catch (error) {
    next(error);
  }
};
