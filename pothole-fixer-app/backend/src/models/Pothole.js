const mongoose = require('mongoose');

const potholeSchema = new mongoose.Schema({
  // Location Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;    // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  
  // Address Information (geocoded from coordinates)
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    formattedAddress: String
  },

  // Road Information
  roadType: {
    type: String,
    enum: ['Highway', 'Main Road', 'Inner Road', 'Alley'],
    required: true
  },

  // Priority based on road type (calculated automatically)
  priority: {
    type: Number,
    default: function() {
      const priorities = {
        'Highway': 1,
        'Main Road': 2,
        'Inner Road': 3,
        'Alley': 4
      };
      return priorities[this.roadType] || 4;
    }
  },

  // Image Information
  image: {
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    url: String // For serving images
  },

  // Status Information
  status: {
    type: String,
    enum: ['Not Fixed', 'Under Progress', 'Fixed'],
    default: 'Not Fixed'
  },

  // Severity Assessment
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  // Reporting Information
  reportedBy: {
    userId: String, // For future user authentication
    username: String,
    email: String
  },

  // Administrative Information
  assignedTo: {
    departmentId: String,
    departmentName: String,
    contactInfo: String
  },

  // Status History
  statusHistory: [{
    status: String,
    updatedBy: String,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],

  // Additional Details
  description: {
    type: String,
    maxlength: 500
  },

  // Estimated repair information
  estimatedRepairDate: Date,
  actualRepairDate: Date,
  repairCost: Number,

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  tags: [String], // For categorization

  // Voting/Rating system
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    voters: [String] // User IDs who voted
  }

}, {
  timestamps: true, // Creates createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
potholeSchema.index({ location: '2dsphere' });

// Create compound index for efficient sorting
potholeSchema.index({ priority: 1, createdAt: -1 });
potholeSchema.index({ status: 1, priority: 1 });

// Virtual for status emoji
potholeSchema.virtual('statusEmoji').get(function() {
  const emojiMap = {
    'Not Fixed': '🟥',
    'Under Progress': '🟨',
    'Fixed': '🟩'
  };
  return emojiMap[this.status] || '⚪';
});

// Virtual for priority text
potholeSchema.virtual('priorityText').get(function() {
  const priorityMap = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low'
  };
  return priorityMap[this.priority] || 'Unknown';
});

// Pre-save middleware to update priority based on road type
potholeSchema.pre('save', function(next) {
  if (this.isModified('roadType')) {
    const priorities = {
      'Highway': 1,
      'Main Road': 2,
      'Inner Road': 3,
      'Alley': 4
    };
    this.priority = priorities[this.roadType] || 4;
  }
  next();
});

// Pre-save middleware to add status history
potholeSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
      updatedBy: this.modifiedBy || 'System'
    });
  }
  next();
});

// Static method to find potholes by proximity
potholeSchema.statics.findByProximity = function(longitude, latitude, maxDistance = 1000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

// Static method to get potholes sorted by priority
potholeSchema.statics.findSortedByPriority = function(status = null) {
  const query = status ? { status, isActive: true } : { isActive: true };
  return this.find(query).sort({ priority: 1, createdAt: -1 });
};

// Instance method to update status with history
potholeSchema.methods.updateStatus = function(newStatus, updatedBy = 'System', notes = '') {
  this.statusHistory.push({
    status: this.status,
    updatedBy,
    updatedAt: new Date(),
    notes
  });
  this.status = newStatus;
  this.modifiedBy = updatedBy;
  return this.save();
};

module.exports = mongoose.model('Pothole', potholeSchema);