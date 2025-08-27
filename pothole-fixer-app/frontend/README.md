# Pothole Fixer Mobile App

React Native cross-platform mobile application for reporting and tracking pothole repairs.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL and API keys

# Start the development server
npm start

# Run on specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
npm run web        # Web browser
```

## 📱 App Structure

### Navigation
- **Bottom Tab Navigator**: Main app navigation
- **Stack Navigators**: Individual tab stacks with detail screens
- **Deep Linking**: Support for external app links

### Screens
1. **Map Screen**: Interactive map with pothole markers
2. **Upload Screen**: Report new potholes with image and GPS
3. **Status Screen**: Dashboard with filtering and search
4. **Profile Screen**: User stats, settings, and achievements
5. **Pothole Detail**: Detailed view with history and actions

## 🛠️ Technology Stack

### Core Technologies
- **React Native**: 0.72.6
- **Expo**: ~49.0.15
- **React Navigation**: 6.x
- **React Native Paper**: Material Design components
- **React Native Maps**: Interactive maps
- **React Native Animatable**: Smooth animations

### Key Dependencies
- **Expo Camera**: Photo capture functionality
- **Expo Location**: GPS and location services
- **Expo Image Picker**: Gallery image selection
- **Axios**: HTTP client for API calls
- **React Context**: Global state management
- **AsyncStorage**: Local data persistence

## 🎨 Design System

### Theme Configuration
Located in `src/utils/theme.js`:

```javascript
export const colors = {
  primary: '#1e3a8a',      // Blue
  secondary: '#f59e0b',    // Amber
  accent: '#10b981',       // Emerald
  background: '#f8fafc',   // Light gray
  surface: '#ffffff',      // White
  text: '#1f2937',         // Dark gray
  
  // Status colors
  notFixed: '#ef4444',     // Red
  underProgress: '#f59e0b', // Yellow
  fixed: '#10b981',        // Green
};
```

### Typography Scale
- **h1-h6**: Heading styles
- **body1-body2**: Body text styles
- **caption**: Small text style
- **button**: Button text style

### Spacing System
Based on 8px grid system:
```javascript
export const spacing = {
  xs: 4,   sm: 8,   md: 16,
  lg: 24,  xl: 32,  xxl: 48
};
```

## 📱 Features

### Core Features
- ✅ Photo capture and gallery selection
- ✅ GPS location detection
- ✅ Interactive map with markers
- ✅ Status filtering and search
- ✅ Offline-ready architecture
- ✅ Dark mode support
- ✅ Smooth animations
- ✅ Form validation
- ✅ Error handling

### Advanced Features
- 🔄 Pull-to-refresh
- 🎯 Geolocation-based filtering
- 📊 Statistics dashboard
- 🏆 Gamification elements
- 🎨 Modern UI/UX
- 📱 Platform-specific optimizations

## 🔧 Configuration

### Environment Variables (.env)
```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Settings
APP_NAME=Pothole Fixer
DEBUG_MODE=true
```

### App Configuration (app.json)
Key configurations:
- Platform-specific icons and splash screens
- Permission requests for camera, location, and storage
- Bundle identifiers and version codes
- Expo plugins for native functionality

## 📂 File Structure

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   ├── navigation/
│   │   └── AppNavigator.js      # Main navigation setup
│   ├── screens/
│   │   ├── MapScreen.js         # Interactive map view
│   │   ├── UploadScreen.js      # Pothole reporting form
│   │   ├── StatusScreen.js      # Dashboard with list view
│   │   ├── ProfileScreen.js     # User profile and settings
│   │   └── PotholeDetailScreen.js # Detailed pothole view
│   ├── services/
│   │   ├── api.js               # API integration layer
│   │   └── GlobalContext.js     # Global state management
│   ├── utils/
│   │   └── theme.js             # Design system and theming
│   └── assets/
│       ├── images/              # App icons and images
│       └── animations/          # Lottie animations
├── App.js                       # Root component
├── package.json
├── app.json                     # Expo configuration
└── babel.config.js             # Babel configuration
```

## 🔄 State Management

### Global Context Structure
```javascript
const globalState = {
  // User state
  user: null,
  isAuthenticated: false,
  
  // Location state
  currentLocation: null,
  locationPermission: null,
  
  // Data state
  potholes: [],
  selectedPothole: null,
  filters: { status: null, roadType: null },
  
  // UI state
  isLoading: false,
  error: null,
  theme: 'light',
  
  // Upload state
  uploadProgress: 0,
  isUploading: false
};
```

### Action Creators
Centralized actions for state updates:
- `setLoading(boolean)`: Loading state
- `setError(string)`: Error messages
- `setPotholes(array)`: Update pothole list
- `setLocation(object)`: GPS coordinates
- `setFilters(object)`: Search filters

## 🌐 API Integration

### Service Layer (`src/services/api.js`)
Centralized API communication with:
- Automatic token management
- Request/response interceptors
- Error handling and retry logic
- Upload progress tracking

### Key API Functions
```javascript
// Upload pothole with progress
await uploadWithProgress(data, (progress) => {
  setUploadProgress(progress);
});

// Get filtered potholes
const response = await potholeAPI.getPotholes({
  status: 'Not Fixed',
  roadType: 'Highway',
  sortBy: 'priority'
});

// Get pothole details
const pothole = await potholeAPI.getPotholeById(id);
```

## 📱 Platform-Specific Features

### iOS
- Native navigation feel with proper animations
- iOS-style alerts and action sheets
- Haptic feedback integration
- Dark mode support following system settings

### Android
- Material Design components
- Android-specific permissions handling
- Back button behavior
- Custom splash screen

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Component testing
npm run test:components

# Integration testing
npm run test:integration

# E2E testing (requires setup)
npm run test:e2e
```

### Test Structure
- Component unit tests
- API integration tests
- Navigation testing
- State management testing

## 🚀 Building & Deployment

### Development Build
```bash
# Start development server
npm start

# Clear cache if needed
npm start -- --clear
```

### Production Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Over-The-Air Updates
```bash
# Publish update
expo publish

# Update with EAS
eas update --branch production
```

## 🔧 Performance Optimization

### Image Optimization
- Automatic image compression before upload
- Lazy loading for list images
- Caching strategy for downloaded images

### Memory Management
- Efficient FlatList usage with `getItemLayout`
- Image memory optimization
- Component unmounting cleanup

### Network Optimization
- Request caching
- Retry logic for failed requests
- Offline handling

## 📊 Analytics & Monitoring

### Crash Reporting
Integration ready for:
- Sentry for error tracking
- Crashlytics for crash reporting
- Custom analytics events

### Performance Monitoring
- React Native Performance Monitor
- Bundle size analysis
- Memory usage tracking

## 🎨 Animations

### Smooth Transitions
- Screen transition animations
- Component mounting animations
- Gesture-based interactions
- Loading state animations

### Animation Libraries
- **React Native Animatable**: Simple declarative animations
- **React Native Reanimated**: Complex gesture animations
- **Lottie**: Vector-based animations

## 🔐 Security

### Data Protection
- Secure storage for sensitive data
- Certificate pinning for API calls
- Input validation and sanitization

### Permission Handling
- Runtime permission requests
- Graceful permission denial handling
- Clear permission explanations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit pull request

### Code Style
- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- Component documentation

## 📞 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npx react-native start --reset-cache
```

**iOS build issues:**
```bash
cd ios && pod install
```

**Android build issues:**
```bash
cd android && ./gradlew clean
```

**Environment issues:**
- Verify .env file configuration
- Check API connectivity
- Validate Google Maps API key

### Debug Mode
Enable debug mode in .env:
```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)

## 📄 License

MIT License - see LICENSE file for details.