# 🛠️ Setup Guide - Pothole Fixer App

Complete setup instructions for the Pothole Fixer cross-platform mobile application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB 6.0+** - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** - [Download here](https://git-scm.com/)

### Mobile Development
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Android Studio** (for Android development) - [Download here](https://developer.android.com/studio)
- **Xcode** (for iOS development, Mac only) - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)

### Optional but Recommended
- **VS Code** - [Download here](https://code.visualstudio.com/)
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing

## 🚀 Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pothole-fixer-app
```

### 2. Backend Setup

#### 2.1 Install Dependencies
```bash
cd backend
npm install
```

#### 2.2 Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB and start the service
# On macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# On Ubuntu:
sudo apt-get install mongodb
sudo systemctl start mongodb

# On Windows:
# Download and install MongoDB Community Server
# Start MongoDB as a Windows service
```

**Option B: MongoDB Atlas (Recommended for beginners)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Whitelist your IP address

#### 2.3 Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (choose one)
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/pothole_fixer

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pothole_fixer

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Google Maps API (get from Google Cloud Console)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2.4 Test Backend
```bash
# Start the development server
npm run dev

# You should see:
# 🚀 Pothole Fixer API Server started successfully!
# 📍 Server Details:
#    • Port: 3000
#    • Environment: development
#    • API URL: http://localhost:3000

# Test the health endpoint
curl http://localhost:3000/health
```

### 3. Frontend Setup

Open a new terminal window/tab:

#### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

#### 3.2 Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file
nano .env
```

**Required Environment Variables:**
```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000

# Google Maps API Key (same as backend)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
APP_NAME=Pothole Fixer
APP_VERSION=1.0.0

# Feature Flags
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=false
ENABLE_CRASH_REPORTING=false

# Development Settings
DEBUG_MODE=true
LOG_LEVEL=debug
```

#### 3.3 Start the Development Server
```bash
npm start
```

This will start the Expo development server and show a QR code.

### 4. Running on Devices

#### 4.1 Physical Device (Recommended for beginners)
1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in your terminal with:
   - **iOS**: Camera app or Expo Go app
   - **Android**: Expo Go app

#### 4.2 iOS Simulator (Mac only)
```bash
# In the Expo CLI, press 'i'
# Or run:
npm run ios
```

#### 4.3 Android Emulator
1. Set up Android emulator in Android Studio
2. Start the emulator
3. In the Expo CLI, press 'a' or run:
```bash
npm run android
```

## 🔑 Getting API Keys

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional)
4. Create credentials (API Key)
5. Restrict the API key to your domains/apps for security

**For React Native:**
- Add your bundle ID (iOS) and package name (Android)
- Add localhost for development

## 🧪 Testing the Setup

### 1. Backend Health Check
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API documentation
curl http://localhost:3000/

# Expected response: Server information and available endpoints
```

### 2. Upload Test (Optional)
```bash
# Test image upload with a sample image
curl -X POST http://localhost:3000/api/potholes/upload \
  -F "image=@test-image.jpg" \
  -F "longitude=-122.4194" \
  -F "latitude=37.7749" \
  -F "roadType=Highway" \
  -F "description=Test pothole"
```

### 3. Frontend Test
1. Open the app on your device/emulator
2. Check if all tabs load correctly
3. Try taking a photo or selecting from gallery
4. Test GPS location detection
5. View the map screen

## 🔧 Development Tools Setup

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Debugging Setup
1. **React Native Debugger**: [Download here](https://github.com/jhen0409/react-native-debugger)
2. **Flipper**: [Download here](https://fbflipper.com/) (for advanced debugging)

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if MongoDB is running
# On macOS:
brew services list | grep mongodb

# On Ubuntu:
sudo systemctl status mongodb

# Check if port 3000 is available
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

#### Frontend Issues
```bash
# Clear Expo cache
expo start --clear

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules
npm install
```

#### Permission Issues (iOS)
- Check `app.json` for proper permission descriptions
- Ensure Info.plist has proper usage descriptions

#### Android Build Issues
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
```

### Getting Help
1. Check console logs for error messages
2. Verify environment variables are set correctly
3. Ensure all services are running
4. Check network connectivity
5. Review the troubleshooting sections in individual README files

## 🎯 Next Steps

After successful setup:

1. **Explore the App**: Test all features thoroughly
2. **Read Documentation**: Review the main README and component docs
3. **Customize**: Modify colors, branding, and features as needed
4. **Deploy**: Follow deployment guides for production setup
5. **Contribute**: Consider contributing back to the project

## 📞 Support

If you encounter issues:
- Check the troubleshooting section above
- Review the individual README files in backend/ and frontend/
- Create an issue on GitHub with:
  - Your operating system
  - Node.js version (`node --version`)
  - Error messages and logs
  - Steps to reproduce the issue

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Backend server starts successfully
- [ ] Frontend dependencies installed
- [ ] Frontend .env configured
- [ ] Expo CLI installed
- [ ] Google Maps API key obtained and configured
- [ ] App runs on device/emulator
- [ ] Can upload photos and detect GPS location
- [ ] Map shows markers correctly

**Congratulations! 🎉 You're ready to start developing with Pothole Fixer!**