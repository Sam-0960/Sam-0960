const Pothole = require('../models/Pothole');
const { validationResult } = require('express-validator');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Upload a new pothole report
const uploadPothole = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const { longitude, latitude, roadType, description, severity } = req.body;

    // Process and optimize the image
    const processedImagePath = await processImage(req.file);

    // Create pothole record
    const pothole = new Pothole({
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      roadType,
      description,
      severity: severity || 'Medium',
      image: {
        filename: path.basename(processedImagePath),
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: processedImagePath,
        url: `/uploads/${path.basename(processedImagePath)}`
      },
      reportedBy: {
        userId: req.user?.id || 'anonymous',
        username: req.user?.username || 'Anonymous User',
        email: req.user?.email || null
      }
    });

    await pothole.save();

    // Add points to user if authenticated
    if (req.user) {
      const pointsAdded = req.user.addPoints(10); // 10 points for reporting
      req.user.stats.potholeReports += 1;
      
      // Check for badges
      if (req.user.stats.potholeReports === 1) {
        req.user.addBadge('First Reporter', 'Reported your first pothole', '🎯');
      } else if (req.user.stats.potholeReports === 10) {
        req.user.addBadge('Community Helper', 'Reported 10 potholes', '🏆');
      } else if (req.user.stats.potholeReports === 50) {
        req.user.addBadge('Road Warrior', 'Reported 50 potholes', '⭐');
      }
      
      await req.user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Pothole reported successfully',
      data: pothole,
      points: req.user ? req.user.stats.points : null
    });

  } catch (error) {
    console.error('Error uploading pothole:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading pothole report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all potholes with sorting and filtering
const getPotholes = async (req, res) => {
  try {
    const {
      status,
      roadType,
      severity,
      sortBy = 'priority',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
      longitude,
      latitude,
      radius = 10000 // 10km default radius
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (status) query.status = status;
    if (roadType) query.roadType = roadType;
    if (severity) query.severity = severity;

    // Location-based filtering
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // Sorting options
    let sortOptions = {};
    if (sortBy === 'priority') {
      sortOptions = { priority: sortOrder === 'desc' ? -1 : 1, createdAt: -1 };
    } else if (sortBy === 'date') {
      sortOptions = { createdAt: sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'status') {
      sortOptions = { status: sortOrder === 'desc' ? -1 : 1, priority: 1 };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const potholes = await Pothole.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-statusHistory') // Exclude status history for performance
      .lean();

    // Get total count for pagination
    const total = await Pothole.countDocuments(query);

    // Add status emojis to results
    const potholesWithEmojis = potholes.map(pothole => ({
      ...pothole,
      statusEmoji: getStatusEmoji(pothole.status),
      priorityText: getPriorityText(pothole.priority)
    }));

    res.json({
      success: true,
      data: potholesWithEmojis,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      filters: {
        status,
        roadType,
        severity,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching potholes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching potholes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a single pothole by ID
const getPotholeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pothole = await Pothole.findById(id);
    
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...pothole.toObject(),
        statusEmoji: getStatusEmoji(pothole.status),
        priorityText: getPriorityText(pothole.priority)
      }
    });

  } catch (error) {
    console.error('Error fetching pothole:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pothole',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update pothole status (admin only)
const updateStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes, estimatedRepairDate } = req.body;

    const pothole = await Pothole.findById(id);
    
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole not found'
      });
    }

    // Update status with history
    await pothole.updateStatus(
      status,
      req.user?.username || 'Admin',
      notes
    );

    // Update additional fields if provided
    if (estimatedRepairDate) {
      pothole.estimatedRepairDate = new Date(estimatedRepairDate);
    }

    if (status === 'Fixed') {
      pothole.actualRepairDate = new Date();
    }

    await pothole.save();

    res.json({
      success: true,
      message: 'Pothole status updated successfully',
      data: {
        ...pothole.toObject(),
        statusEmoji: getStatusEmoji(pothole.status),
        priorityText: getPriorityText(pothole.priority)
      }
    });

  } catch (error) {
    console.error('Error updating pothole status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pothole status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get statistics
const getStatistics = async (req, res) => {
  try {
    const stats = await Pothole.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalPotholes: { $sum: 1 },
          notFixed: {
            $sum: { $cond: [{ $eq: ['$status', 'Not Fixed'] }, 1, 0] }
          },
          underProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'Under Progress'] }, 1, 0] }
          },
          fixed: {
            $sum: { $cond: [{ $eq: ['$status', 'Fixed'] }, 1, 0] }
          },
          highway: {
            $sum: { $cond: [{ $eq: ['$roadType', 'Highway'] }, 1, 0] }
          },
          mainRoad: {
            $sum: { $cond: [{ $eq: ['$roadType', 'Main Road'] }, 1, 0] }
          },
          innerRoad: {
            $sum: { $cond: [{ $eq: ['$roadType', 'Inner Road'] }, 1, 0] }
          },
          alley: {
            $sum: { $cond: [{ $eq: ['$roadType', 'Alley'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPotholes: 0,
      notFixed: 0,
      underProgress: 0,
      fixed: 0,
      highway: 0,
      mainRoad: 0,
      innerRoad: 0,
      alley: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        statusBreakdown: {
          'Not Fixed': { count: result.notFixed, emoji: '🟥' },
          'Under Progress': { count: result.underProgress, emoji: '🟨' },
          'Fixed': { count: result.fixed, emoji: '🟩' }
        },
        roadTypeBreakdown: {
          'Highway': result.highway,
          'Main Road': result.mainRoad,
          'Inner Road': result.innerRoad,
          'Alley': result.alley
        }
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper functions
const processImage = async (file) => {
  const filename = `processed_${Date.now()}_${file.originalname}`;
  const outputPath = path.join(process.env.UPLOAD_PATH || './uploads', filename);
  
  await sharp(file.path)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(outputPath);
    
  // Delete original file
  await fs.unlink(file.path);
  
  return outputPath;
};

const getStatusEmoji = (status) => {
  const emojiMap = {
    'Not Fixed': '🟥',
    'Under Progress': '🟨',
    'Fixed': '🟩'
  };
  return emojiMap[status] || '⚪';
};

const getPriorityText = (priority) => {
  const priorityMap = {
    1: 'Critical',
    2: 'High', 
    3: 'Medium',
    4: 'Low'
  };
  return priorityMap[priority] || 'Unknown';
};

module.exports = {
  uploadPothole,
  getPotholes,
  getPotholeById,
  updateStatus,
  getStatistics
};