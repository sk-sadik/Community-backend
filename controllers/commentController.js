const Comment = require('../models/Comment');
const Issue = require('../models/Issue');

// @desc    Add a comment to an issue
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { issue, comment } = req.body;

    if (!issue || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both issue ID and comment text'
      });
    }

    // Verify issue exists
    const issueExists = await Issue.findById(issue);
    if (!issueExists) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${issue}`
      });
    }

    let newComment = await Comment.create({
      issue,
      user: req.user.id,
      comment
    });

    // Populate user profile info for response
    newComment = await newComment.populate('user', 'name email profileImage');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View all comments for a specific issue
// @route   GET /api/comments/:issueId
// @access  Private
exports.getCommentsByIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    // Verify issue exists
    const issueExists = await Issue.findById(issueId);
    if (!issueExists) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${issueId}`
      });
    }

    const comments = await Comment.find({ issue: issueId })
      .populate('user', 'name email profileImage')
      .sort({ createdAt: 1 }); // Chronological order

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (only owner can delete)
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `Comment not found with ID: ${req.params.id}`
      });
    }

    // Verify ownership: only the user who made the comment can delete it
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
