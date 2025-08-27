const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String,
    bio: String
  },

  // User Role
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },

  // Gamification
  stats: {
    potholeReports: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      icon: String
    }],
    level: {
      type: Number,
      default: 1
    }
  },

  // Preferences
  preferences: {
    notifications: {
      pushEnabled: {
        type: Boolean,
        default: true
      },
      emailEnabled: {
        type: Boolean,
        default: true
      },
      reportUpdates: {
        type: Boolean,
        default: true
      },
      nearbyPotholes: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      shareLocation: {
        type: Boolean,
        default: true
      }
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  // Tokens
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Device Information (for push notifications)
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Location (for nearby features)
  lastKnownLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number], // [longitude, latitude]
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }

}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ lastKnownLocation: '2dsphere' });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Virtual for user level calculation
userSchema.virtual('stats.calculatedLevel').get(function() {
  const points = this.stats.points;
  return Math.floor(points / 100) + 1; // Level up every 100 points
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add points and check for level up
userSchema.methods.addPoints = function(points) {
  const oldLevel = this.stats.level;
  this.stats.points += points;
  this.stats.level = Math.floor(this.stats.points / 100) + 1;
  
  // Check if leveled up
  const leveledUp = this.stats.level > oldLevel;
  return { leveledUp, newLevel: this.stats.level, totalPoints: this.stats.points };
};

// Method to add badge
userSchema.methods.addBadge = function(badgeName, description, icon) {
  const existingBadge = this.stats.badges.find(badge => badge.name === badgeName);
  if (!existingBadge) {
    this.stats.badges.push({
      name: badgeName,
      description,
      icon,
      earnedAt: new Date()
    });
    return true;
  }
  return false;
};

// Method to update location
userSchema.methods.updateLocation = function(longitude, latitude) {
  this.lastKnownLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    updatedAt: new Date()
  };
  return this.save();
};

// Static method to find users near a location
userSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    lastKnownLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    'preferences.privacy.shareLocation': true
  });
};

module.exports = mongoose.model('User', userSchema);