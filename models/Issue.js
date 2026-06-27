const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an issue title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add an issue description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please specify an issue category'],
      enum: [
        'Road',
        'Municipal',
        'Electrical',
        'Garbage',
        'Drainage',
        'Water Supply',
        'Street Light',
        'Public Property',
        'Others'
      ]
    },
    image: {
      type: String,
      required: [false, 'Please upload an image showing the issue']
    },
    location: {
      address: {
        type: String,
        required: [true, 'Please add a location address']
      },
      city: {
        type: String,
        required: [true, 'Please add a city'],
        trim: true,
        index: true
      },
      district: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      pincode: {
        type: String,
        trim: true
      },
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Verified',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected'
      ],
      default: 'Pending'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Issue', IssueSchema);
