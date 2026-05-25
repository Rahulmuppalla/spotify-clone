const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../../uploads'),
  path.join(__dirname, '../../uploads/audio'),
  path.join(__dirname, '../../uploads/covers')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, path.join(__dirname, '../../uploads/audio'));
    } else if (file.fieldname === 'cover') {
      cb(null, path.join(__dirname, '../../uploads/covers'));
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    // Allow mp3, wav, m4a, ogg
    const allowedAudioTypes = ['.mp3', '.wav', '.m4a', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedAudioTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only mp3, wav, m4a, ogg audio formats are allowed'), false);
    }
  } else if (file.fieldname === 'cover') {
    // Allow jpeg, png, webp
    const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedImageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, jpeg, png, webp image formats are allowed'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit per file
  }
});

module.exports = upload;
