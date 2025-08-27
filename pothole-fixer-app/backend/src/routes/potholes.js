const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, query, param } = require('express-validator');
const {
  uploadPothole,
  getPotholes,
  getPotholeById,
  updateStatus,
  getStatistics
} = require('../controllers/potholeController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pothole-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Validation rules
const uploadValidation = [
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('roadType')
    .isIn(['Highway', 'Main Road', 'Inner Road', 'Alley'])
    .withMessage('Invalid road type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('severity')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid severity level')
];

const statusUpdateValidation = [
  param('id').isMongoId().withMessage('Invalid pothole ID'),
  body('status')
    .isIn(['Not Fixed', 'Under Progress', 'Fixed'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('estimatedRepairDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['Not Fixed', 'Under Progress', 'Fixed'])
    .withMessage('Invalid status filter'),
  query('roadType')
    .optional()
    .isIn(['Highway', 'Main Road', 'Inner Road', 'Alley'])
    .withMessage('Invalid road type filter'),
  query('severity')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid severity filter'),
  query('sortBy')
    .optional()
    .isIn(['priority', 'date', 'status'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be between 100m and 50km')
];

// Routes

/**
 * @route   POST /api/potholes/upload
 * @desc    Upload a new pothole report
 * @access  Public (optionally authenticated)
 */
router.post('/upload', 
  rateLimiter(10, 15), // 10 requests per 15 minutes
  authenticateUser(false), // Optional authentication
  upload.single('image'),
  uploadValidation,
  uploadPothole
);

/**
 * @route   GET /api/potholes
 * @desc    Get all potholes with filtering and sorting
 * @access  Public
 */
router.get('/',
  rateLimiter(50, 15), // 50 requests per 15 minutes
  queryValidation,
  getPotholes
);

/**
 * @route   GET /api/potholes/stats
 * @desc    Get pothole statistics
 * @access  Public
 */
router.get('/stats',
  rateLimiter(20, 15), // 20 requests per 15 minutes
  getStatistics
);

/**
 * @route   GET /api/potholes/:id
 * @desc    Get a single pothole by ID
 * @access  Public
 */
router.get('/:id',
  rateLimiter(30, 15), // 30 requests per 15 minutes
  param('id').isMongoId().withMessage('Invalid pothole ID'),
  getPotholeById
);

/**
 * @route   PUT /api/potholes/:id/status
 * @desc    Update pothole status (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status',
  rateLimiter(20, 15), // 20 requests per 15 minutes
  authenticateUser(true), // Required authentication
  requireAdmin,
  statusUpdateValidation,
  updateStatus
);

/**
 * @route   DELETE /api/potholes/:id
 * @desc    Soft delete a pothole (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  rateLimiter(10, 15), // 10 requests per 15 minutes
  authenticateUser(true),
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid pothole ID'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const pothole = await require('../models/Pothole').findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      
      if (!pothole) {
        return res.status(404).json({
          success: false,
          message: 'Pothole not found'
        });
      }

      res.json({
        success: true,
        message: 'Pothole deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting pothole:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting pothole',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }
  
  next(error);
});

module.exports = router;