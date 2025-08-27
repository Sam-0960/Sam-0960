# Pothole Fixer Backend API

Node.js/Express backend server for the Pothole Fixer mobile application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB
mongod

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Currently, authentication is optional for most endpoints. Admin endpoints require authentication.

### Rate Limiting
- Default: 100 requests per 15 minutes
- Upload endpoints: 10 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

## 🔗 Endpoints

### Health Check
```http
GET /health
```

Returns server status and version information.

### Upload Pothole
```http
POST /api/potholes/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `image` (file, required): Image file (max 5MB)
- `longitude` (number, required): GPS longitude (-180 to 180)
- `latitude` (number, required): GPS latitude (-90 to 90)
- `roadType` (string, required): "Highway" | "Main Road" | "Inner Road" | "Alley"
- `description` (string, optional): Description (max 500 chars)
- `severity` (string, optional): "Low" | "Medium" | "High" | "Critical"

**Response:**
```json
{
  "success": true,
  "message": "Pothole reported successfully",
  "data": {
    "_id": "...",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "roadType": "Highway",
    "status": "Not Fixed",
    "priority": 1,
    "image": {
      "filename": "...",
      "url": "/uploads/..."
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "statusEmoji": "🟥"
  }
}
```

### Get Potholes
```http
GET /api/potholes
```

**Query Parameters:**
- `status`: Filter by status ("Not Fixed" | "Under Progress" | "Fixed")
- `roadType`: Filter by road type
- `severity`: Filter by severity level
- `sortBy`: Sort field ("priority" | "date" | "status")
- `sortOrder`: Sort direction ("asc" | "desc")
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `longitude`: Center longitude for location search
- `latitude`: Center latitude for location search
- `radius`: Search radius in meters (default: 10000)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 250,
    "itemsPerPage": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Get Pothole by ID
```http
GET /api/potholes/:id
```

Returns detailed information for a specific pothole including status history.

### Update Pothole Status (Admin Only)
```http
PUT /api/potholes/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "Under Progress",
  "notes": "Repair work has begun",
  "estimatedRepairDate": "2024-01-15T00:00:00.000Z"
}
```

### Get Statistics
```http
GET /api/potholes/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPotholes": 1250,
    "statusBreakdown": {
      "Not Fixed": { "count": 800, "emoji": "🟥" },
      "Under Progress": { "count": 300, "emoji": "🟨" },
      "Fixed": { "count": 150, "emoji": "🟩" }
    },
    "roadTypeBreakdown": {
      "Highway": 200,
      "Main Road": 400,
      "Inner Road": 500,
      "Alley": 150
    }
  }
}
```

## 🗃️ Database Schema

### Pothole Model
```javascript
{
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  roadType: "Highway" | "Main Road" | "Inner Road" | "Alley",
  priority: 1 | 2 | 3 | 4, // Auto-calculated from roadType
  status: "Not Fixed" | "Under Progress" | "Fixed",
  severity: "Low" | "Medium" | "High" | "Critical",
  image: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    url: String
  },
  description: String,
  reportedBy: {
    userId: String,
    username: String,
    email: String
  },
  statusHistory: [{
    status: String,
    updatedBy: String,
    updatedAt: Date,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 📂 File Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── potholeController.js # Business logic
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── Pothole.js           # Pothole schema
│   │   └── User.js              # User schema
│   ├── routes/
│   │   └── potholes.js          # API routes
│   └── server.js                # Express server setup
├── uploads/                     # Image storage directory
├── package.json
└── .env.example
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: All inputs validated and sanitized
- **File Upload Security**: File type and size restrictions
- **CORS Protection**: Configurable CORS policies
- **Helmet**: Security headers
- **Error Handling**: No sensitive information exposure

## 🔧 Configuration

### Environment Variables
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pothole_fixer

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with specific environment
NODE_ENV=test npm test

# Coverage report
npm run test:coverage
```

### Test Endpoints
Use tools like Postman, Insomnia, or curl to test the API:

```bash
# Health check
curl http://localhost:3000/health

# Get potholes
curl http://localhost:3000/api/potholes

# Upload pothole (example with curl)
curl -X POST http://localhost:3000/api/potholes/upload \
  -F "image=@test-image.jpg" \
  -F "longitude=-122.4194" \
  -F "latitude=37.7749" \
  -F "roadType=Highway"
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas for database
3. Configure proper CORS origins
4. Set up file storage (AWS S3 recommended)
5. Use PM2 for process management
6. Set up monitoring and logging

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

The API includes built-in logging with Morgan and error tracking. For production:

- Use application monitoring (New Relic, DataDog)
- Set up log aggregation (ELK stack)
- Monitor database performance
- Track API response times

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update API documentation
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For backend-specific issues:
- Check server logs
- Verify database connection
- Validate environment variables
- Test API endpoints individually