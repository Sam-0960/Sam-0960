# 🛣️ Pothole Fixer - Cross-Platform Mobile App

A modern, feature-rich mobile application built with React Native and Node.js for reporting and tracking pothole repairs. Help improve road safety by reporting potholes in your community with GPS accuracy and real-time status tracking.

![Pothole Fixer](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.72-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green)

## ✨ Features

### 📱 Mobile App Features
- **📸 Image Upload**: Take photos or select from gallery with automatic compression
- **📍 GPS Location**: Automatic location detection using device GPS
- **🛣️ Road Type Selection**: Highway, Main Road, Inner Road, Alley classification
- **🗺️ Interactive Map**: View all potholes with color-coded status markers
- **📊 Status Dashboard**: List view with priority sorting and filtering
- **🔍 Search & Filter**: Find potholes by status, road type, or description
- **📈 Statistics**: Real-time analytics and progress tracking
- **🎮 Gamification**: Points, badges, and levels for user engagement
- **🌓 Dark Mode**: Toggle between light and dark themes
- **🔔 Push Notifications**: Updates when reported potholes are fixed (planned)

### 🖥️ Backend Features
- **RESTful API**: Complete CRUD operations for pothole management
- **🗄️ Database**: MongoDB with geospatial indexing
- **📁 File Upload**: Image storage with automatic optimization
- **🔐 Security**: Rate limiting, input validation, and error handling
- **📊 Analytics**: Comprehensive statistics and reporting
- **🚦 Status Management**: Three-tier status system with history tracking
- **🎯 Priority System**: Automatic priority assignment based on road type
- **🌍 Geolocation**: Location-based queries and distance calculations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB 6.0+ (local or Atlas)
- Expo CLI for React Native development
- Android Studio (for Android) or Xcode (for iOS)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd pothole-fixer-app/backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
nano .env

# Start MongoDB (if running locally)
mongod

# Start the backend server
npm run dev
```

The backend will be available at `http://localhost:3000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd pothole-fixer-app/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your backend URL
nano .env

# Start the Expo development server
npm start
```

### 3. Running the App

- **iOS Simulator**: Press `i` in the Expo CLI
- **Android Emulator**: Press `a` in the Expo CLI
- **Physical Device**: Install Expo Go app and scan the QR code

## 📁 Project Structure

```
pothole-fixer-app/
├── backend/                          # Node.js/Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   └── potholeController.js # API logic
│   │   ├── middleware/
│   │   │   ├── auth.js              # Authentication
│   │   │   └── rateLimiter.js       # Rate limiting
│   │   ├── models/
│   │   │   ├── Pothole.js           # Pothole schema
│   │   │   └── User.js              # User schema (future)
│   │   ├── routes/
│   │   │   └── potholes.js          # API routes
│   │   └── server.js                # Main server file
│   ├── uploads/                     # Image storage
│   ├── package.json
│   └── .env.example
│
└── frontend/                        # React Native App
    ├── src/
    │   ├── components/              # Reusable components
    │   ├── navigation/
    │   │   └── AppNavigator.js      # Navigation setup
    │   ├── screens/
    │   │   ├── MapScreen.js         # Interactive map
    │   │   ├── UploadScreen.js      # Report pothole
    │   │   ├── StatusScreen.js      # Dashboard
    │   │   ├── ProfileScreen.js     # User profile
    │   │   └── PotholeDetailScreen.js # Detail view
    │   ├── services/
    │   │   ├── api.js               # API calls
    │   │   └── GlobalContext.js     # State management
    │   ├── utils/
    │   │   └── theme.js             # Design system
    │   └── assets/
    ├── App.js
    ├── package.json
    └── .env.example
```

## 🔧 API Endpoints

### Pothole Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/potholes/upload` | Upload new pothole report |
| `GET` | `/api/potholes` | Get all potholes (with filtering) |
| `GET` | `/api/potholes/stats` | Get statistics |
| `GET` | `/api/potholes/:id` | Get specific pothole |
| `PUT` | `/api/potholes/:id/status` | Update status (admin) |
| `DELETE` | `/api/potholes/:id` | Delete pothole (admin) |

### Request Examples

#### Upload Pothole
```bash
curl -X POST http://localhost:3000/api/potholes/upload \
  -F "image=@pothole.jpg" \
  -F "longitude=-122.4194" \
  -F "latitude=37.7749" \
  -F "roadType=Highway" \
  -F "severity=High" \
  -F "description=Large pothole blocking traffic"
```

#### Get Potholes with Filtering
```bash
curl "http://localhost:3000/api/potholes?status=Not%20Fixed&roadType=Highway&sortBy=priority&limit=20"
```

## 🎨 UI/UX Features

### Design System
- **Colors**: Consistent color palette with status-based theming
- **Typography**: Scalable font system with accessibility support
- **Spacing**: Systematic spacing using 8px grid
- **Shadows**: Material Design elevation system
- **Animations**: Smooth transitions using React Native Animatable

### Status Color Coding
- 🟥 **Red**: Not Fixed - Requires immediate attention
- 🟨 **Yellow**: Under Progress - Being worked on
- 🟩 **Green**: Fixed - Completed repair

### Road Type Priority
1. **Highway** (Critical) - Highest priority
2. **Main Road** (High) - High priority  
3. **Inner Road** (Medium) - Medium priority
4. **Alley** (Low) - Lowest priority

## 🔐 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pothole_fixer

# Security
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
APP_NAME=Pothole Fixer
APP_VERSION=1.0.0

# Features
ENABLE_PUSH_NOTIFICATIONS=true
DEBUG_MODE=true
```

## 📱 Screenshots & Demo

### App Screens
- **Map View**: Interactive map with color-coded markers
- **Upload Screen**: Modern form with image capture and GPS
- **Status Dashboard**: Comprehensive list with filtering
- **Detail View**: Rich pothole information with history
- **Profile**: User stats, achievements, and settings

### Key Interactions
- Tap markers on map to view details
- Swipe to refresh data
- Pull-down search and filtering
- Smooth animations throughout the app

## 🛠️ Development

### Available Scripts

**Backend**
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run tests
```

**Frontend**
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web browser
```

### Adding New Features

1. **Backend**: Add routes in `/src/routes/`, controllers in `/src/controllers/`
2. **Frontend**: Create screens in `/src/screens/`, add to navigation
3. **API Integration**: Update `/src/services/api.js` with new endpoints
4. **State Management**: Extend GlobalContext for new state

### Code Style
- ESLint configuration for consistent code style
- Prettier for automatic code formatting
- Consistent naming conventions throughout

## 🚀 Deployment

### Backend Deployment
- **Platform**: Deploy to Heroku, Railway, or DigitalOcean
- **Database**: Use MongoDB Atlas for production
- **Environment**: Set production environment variables
- **Storage**: Consider AWS S3 for image storage in production

### Mobile App Deployment
- **iOS**: Submit to App Store using Expo Application Services (EAS)
- **Android**: Publish to Google Play Store
- **Updates**: Use Expo Over-The-Air (OTA) updates

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Image storage optimized
- [ ] Push notifications configured
- [ ] Analytics tracking enabled
- [ ] Error monitoring setup
- [ ] Performance monitoring

## 🧪 Testing

### Backend Testing
```bash
# Run API tests
npm test

# Test specific endpoints
npm run test:api

# Load testing
npm run test:load
```

### Frontend Testing
```bash
# Component testing
npm run test

# E2E testing
npm run test:e2e
```

## 📊 Monitoring & Analytics

### Backend Metrics
- API response times
- Error rates and types
- Database query performance
- File upload statistics

### Mobile App Analytics
- User engagement metrics
- Feature usage statistics
- Crash reporting
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Test on both iOS and Android

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join our GitHub Discussions
- **Email**: Contact us at support@potholefixer.com

## 🙏 Acknowledgments

- React Native community for the excellent framework
- Expo team for simplifying mobile development
- MongoDB for reliable data storage
- All contributors who help improve road safety

---

**Made with ❤️ for better roads and safer communities**

Ready to make a difference? Start reporting potholes today! 🛣️