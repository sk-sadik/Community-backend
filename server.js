const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Load environmental configurations
dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.use(cors());
// Standard Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS


// Serve uploads folder static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Bind API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Main Status Health Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Community Service Portal API. Service is live and running.'
  });
});

// Cloudinary Test Endpoint
app.get('/api/test-cloudinary', (req, res) => {
  const cloudinary = require('./config/cloudinary');
  const configStatus = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? 'Configured' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Configured' : 'Missing'
  };
  
  cloudinary.api.ping((error, result) => {
    if (error) {
      res.status(500).json({
        success: false,
        message: 'Cloudinary connection failed',
        config: configStatus,
        error: error.message
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Cloudinary connection successful',
        config: configStatus,
        result: result
      });
    }
  });
});

// Catch-All 404 Route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on endpoint: ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Port and server initialization
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
});

// Catch unhandled database rejection errors
process.on('unhandledRejection', (err, promise) => {
  console.error(`Fatal Unhandled Rejection Error: ${err.message}`);
  // Close database server instance and terminate process execution
  server.close(() => process.exit(1));
});
