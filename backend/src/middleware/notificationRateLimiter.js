const rateLimit = require('express-rate-limit');
const config = require('../config/notificationConfig');

const notificationRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many notification requests. Rate limit exceeded. Please try again later.',
      error: {
        code: 'PROVIDER_RATE_LIMITED',
        limit: config.rateLimit.max,
        windowMs: config.rateLimit.windowMs,
      },
    });
  },
});

module.exports = notificationRateLimiter;
