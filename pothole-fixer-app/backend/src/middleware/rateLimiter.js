const rateLimit = require('express-rate-limit');

// Create a rate limiter factory
const rateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequests, // Limit each IP to maxRequests per windowMs
    message: {
      success: false,
      message: `Too many requests from this IP, please try again after ${windowMinutes} minutes.`,
      retryAfter: windowMinutes * 60
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom key generator (can be enhanced to include user ID for authenticated routes)
    keyGenerator: (req) => {
      // If user is authenticated, use user ID, otherwise use IP
      return req.user?.id || req.ip;
    },
    // Skip successful requests (only count failed ones)
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
    // Custom handler for when limit is exceeded
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: `Too many requests from this IP, please try again after ${windowMinutes} minutes.`,
        retryAfter: windowMinutes * 60,
        limit: maxRequests,
        window: `${windowMinutes} minutes`
      });
    },
    // Store to use for rate limiting (default is memory store)
    // In production, consider using Redis store
    store: undefined // Uses memory store by default
  });
};

// Predefined rate limiters for common use cases
const strictRateLimiter = rateLimiter(5, 15); // 5 requests per 15 minutes
const moderateRateLimiter = rateLimiter(20, 15); // 20 requests per 15 minutes
const lenientRateLimiter = rateLimiter(100, 15); // 100 requests per 15 minutes

// Special rate limiter for file uploads
const uploadRateLimiter = rateLimiter(10, 60); // 10 uploads per hour

// Special rate limiter for authentication endpoints
const authRateLimiter = rateLimiter(5, 15); // 5 auth attempts per 15 minutes

module.exports = {
  rateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  lenientRateLimiter,
  uploadRateLimiter,
  authRateLimiter
};