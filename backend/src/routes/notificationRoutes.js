const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationRateLimiter = require('../middleware/notificationRateLimiter');
const {
  sendNotification,
  sendEmail,
  sendSms,
  getHistory,
  getNotificationById,
} = require('../controllers/notificationController');

// All notification routes are protected with Admin Authentication
router.use(auth);

// Send routes protected with rate limiter
router.post('/send', notificationRateLimiter, sendNotification);
router.post('/email', notificationRateLimiter, sendEmail);
router.post('/sms', notificationRateLimiter, sendSms);

// Audit history and lookup routes
router.get('/history', getHistory);
router.get('/:id', getNotificationById);

module.exports = router;
