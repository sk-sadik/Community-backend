const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require("path");

// Test Cloudinary connection on startup
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error.message);
  } else {
    console.log('Cloudinary connection successful:', result);
  }
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log('Uploading file to Cloudinary:', file.originalname);
    const publicId = `${Date.now()}_${path.parse(file.originalname).name}`;
    console.log('Generated public_id:', publicId);
    return {
      folder: "community-service",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      resource_type: "image",
      public_id: publicId,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif/i;

  const mimeOk = allowedExtensions.test(file.mimetype);
  const extOk = allowedExtensions.test(
    file.originalname.split(".").pop()
  );

  if (mimeOk && extOk) {
    return cb(null, true);
  }

  cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;