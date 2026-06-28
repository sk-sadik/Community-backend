const cloudinary = require('cloudinary').v2;
const Issue = require('../models/Issue');

// Helper to delete an image from Cloudinary by its full URL
const deleteImageFile = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract public_id from Cloudinary URL
    // Handles: https://res.cloudinary.com/<cloud>/image/upload/v<ts>/<folder>/<public_id>.<ext>
    // Also handles transformation params like /c_fill,w_400/v1234...
    const match = imageUrl.match(/\/v\d+\/(.+)\.[\w]+$/);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
      console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
    }
  } catch (err) {
    console.error(`Failed to delete image from Cloudinary:`, err.message);
  }
};

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    // Check if image file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image displaying the issue'
      });
    }

    // Process location - supports JSON string or flat form-data parameters
    let locationData = {};
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        try {
          locationData = JSON.parse(req.body.location);
        } catch (e) {
          // Delete uploaded file if parsing fails
          await deleteImageFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: 'Invalid location JSON format'
          });
        }
      } else {
        locationData = req.body.location;
      }
    } else {
      locationData = {
        address: req.body.address || req.body.locationAddress,
        city: req.body.city || req.body.locationCity,
        district: req.body.district || req.body.locationDistrict,
        state: req.body.state || req.body.locationState,
        pincode: req.body.pincode || req.body.locationPincode,
        latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude ? Number(req.body.longitude) : undefined
      };
    }

    // Validate location address & city
    if (!locationData.address || !locationData.city) {
      await deleteImageFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Location address and city are required'
      });
    }

    const imagePath = req.file.path; // Cloudinary returns the full HTTPS URL as req.file.path

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      image: imagePath,
      location: locationData,
      reportedBy: req.user.id
      // status defaults to 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: issue
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) {
      await deleteImageFile(req.file.path);
    }
    next(error);
  }
};

// @desc    View and filter all issues
// @route   GET /api/issues
// @access  Private (or Public, but usually private according to spec 'authenticated users can')
exports.getIssues = async (req, res, next) => {
  try {
    const queryObj = {};

    // 1. Filtering by fields
    if (req.query.category) queryObj.category = req.query.category;
    if (req.query.status) queryObj.status = req.query.status;
    if (req.query.priority) queryObj.priority = req.query.priority;
    if (req.query.city) {
      queryObj['location.city'] = { $regex: new RegExp(req.query.city, 'i') };
    }

    // 2. Search query (regex matches title or description)
    if (req.query.search) {
      queryObj.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 3. Pagination Setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Count matching documents
    const total = await Issue.countDocuments(queryObj);

    // Fetch and populate results
    const issues = await Issue.find(queryObj)
      .populate('reportedBy', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: issues.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: issues
    });
  } catch (error) {
    next(error);
  }
};
exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).populate(
      'reportedBy',
      'name email phone profileImage'
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    next(error);
  }
};
exports.updateIssue = async (req, res, next) => {
  try {
    let issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${req.params.id}`
      });
    }

    // Verify ownership (only the user who reported it can update it)
    if (issue.reportedBy.toString() !== req.user.id) {
      if (req.file) {
        await deleteImageFile(req.file.path);
      }
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this issue'
      });
    }

    const { title, description, category, priority } = req.body;

    // Build update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;

    // Handle location update
    if (req.body.location || req.body.address || req.body.city) {
      let locationData = {};
      if (req.body.location) {
        if (typeof req.body.location === 'string') {
          try {
            locationData = JSON.parse(req.body.location);
          } catch (e) {
            if (req.file) await deleteImageFile(req.file.path);
            return res.status(400).json({
              success: false,
              message: 'Invalid location JSON format'
            });
          }
        } else {
          locationData = req.body.location;
        }
      } else {
        // Fallback to flat params, merge with old location
        locationData = {
          address: req.body.address || req.body.locationAddress || issue.location.address,
          city: req.body.city || req.body.locationCity || issue.location.city,
          district: req.body.district || req.body.locationDistrict || issue.location.district,
          state: req.body.state || req.body.locationState || issue.location.state,
          pincode: req.body.pincode || req.body.locationPincode || issue.location.pincode,
          latitude: req.body.latitude ? Number(req.body.latitude) : issue.location.latitude,
          longitude: req.body.longitude ? Number(req.body.longitude) : issue.location.longitude
        };
      }
      updateData.location = locationData;
    }

    // Handle image update
    if (req.file) {
      // Delete old image file
      await deleteImageFile(issue.image);
      updateData.image = req.file.path;
    }

    // Save and return
    issue = await Issue.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('reportedBy', 'name email phone profileImage');

    return res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: issue
    });
  } catch (error) {
    if (req.file) {
      await deleteImageFile(req.file.path);
    }
    next(error);
  }
};
exports.deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Issue not found with ID: ${req.params.id}`
      });
    }

    // Verify ownership (only the user who reported it or admin can delete it)
    if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this issue'
      });
    }

    // Clean up uploaded image
    await deleteImageFile(issue.image);

    // Delete issue from DB
    await issue.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
