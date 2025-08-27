require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/database');
const { lenientRateLimiter } = require('./middleware/rateLimiter');

// Import routes
const potholeRoutes = require('./routes/potholes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:19006',
      'exp://localhost:19000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(lenientRateLimiter);

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pothole Fixer API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/potholes', potholeRoutes);

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pothole Fixer API',
    version: '1.0.0',
    documentation: {
      endpoints: {
        'POST /api/potholes/upload': 'Upload a new pothole report',
        'GET /api/potholes': 'Get all potholes with filtering and sorting',
        'GET /api/potholes/stats': 'Get pothole statistics',
        'GET /api/potholes/:id': 'Get a specific pothole by ID',
        'PUT /api/potholes/:id/status': 'Update pothole status (admin only)',
        'DELETE /api/potholes/:id': 'Delete a pothole (admin only)'
      },
      upload: {
        endpoint: '/api/potholes/upload',
        method: 'POST',
        contentType: 'multipart/form-data',
        fields: {
          image: 'Image file (required)',
          longitude: 'Longitude coordinate (required)',
          latitude: 'Latitude coordinate (required)',
          roadType: 'Highway | Main Road | Inner Road | Alley (required)',
          description: 'Optional description (max 500 chars)',
          severity: 'Low | Medium | High | Critical (optional)'
        }
      },
      filtering: {
        queryParams: {
          status: 'Not Fixed | Under Progress | Fixed',
          roadType: 'Highway | Main Road | Inner Road | Alley',
          severity: 'Low | Medium | High | Critical',
          sortBy: 'priority | date | status',
          sortOrder: 'asc | desc',
          page: 'Page number (default: 1)',
          limit: 'Items per page (default: 50, max: 100)',
          longitude: 'Center longitude for location-based search',
          latitude: 'Center latitude for location-based search',
          radius: 'Search radius in meters (default: 10000)'
        }
      },
      statusEmojis: {
        'Not Fixed': '🟥',
        'Under Progress': '🟨',
        'Fixed': '🟩'
      },
      roadTypePriority: {
        'Highway': 1,
        'Main Road': 2,
        'Inner Road': 3,
        'Alley': 4
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/potholes/upload',
      'GET /api/potholes',
      'GET /api/potholes/stats',
      'GET /api/potholes/:id',
      'PUT /api/potholes/:id/status',
      'DELETE /api/potholes/:id'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // CORS error
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Pothole Fixer API Server started successfully!

📍 Server Details:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • API URL: http://localhost:${PORT}
   
📚 API Documentation:
   • Health Check: GET http://localhost:${PORT}/health
   • API Docs: GET http://localhost:${PORT}/
   • Upload Pothole: POST http://localhost:${PORT}/api/potholes/upload
   • Get Potholes: GET http://localhost:${PORT}/api/potholes
   
🔧 Ready to receive requests!
  `);
});

module.exports = app;