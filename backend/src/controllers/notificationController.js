const notificationService = require('../services/notificationService');

/**
 * Map error code to appropriate HTTP status code
 */
function getStatusCodeForError(code) {
  switch (code) {
    case 'VALIDATION_ERROR':
    case 'INVALID_RECIPIENT':
    case 'UNSUPPORTED_SMS_TEMPLATE':
      return 400;
    case 'PROVIDER_AUTHENTICATION_FAILED':
      return 502;
    case 'PROVIDER_RATE_LIMITED':
      return 429;
    case 'PROVIDER_UNAVAILABLE':
      return 503;
    case 'UNSUPPORTED_NOTIFICATION_TYPE':
      return 400;
    default:
      return 500;
  }
}

/**
 * POST /api/notifications/send
 * Unified endpoint for dispatching notifications (Email or SMS)
 */
exports.sendNotification = async (req, res) => {
  try {
    const result = await notificationService.send(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = getStatusCodeForError(err.code);
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to dispatch notification',
      error: {
        code: err.code || 'NOTIFICATION_SEND_FAILED',
        field: err.field,
      },
    });
  }
};

/**
 * POST /api/notifications/email
 * Direct endpoint for sending email notifications
 */
exports.sendEmail = async (req, res) => {
  try {
    const result = await notificationService.sendEmail(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = getStatusCodeForError(err.code);
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to send email notification',
      error: {
        code: err.code || 'NOTIFICATION_SEND_FAILED',
        field: err.field,
      },
    });
  }
};

/**
 * POST /api/notifications/sms
 * Direct endpoint for sending SMS notifications
 */
exports.sendSms = async (req, res) => {
  try {
    const result = await notificationService.sendSms(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = getStatusCodeForError(err.code);
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to send SMS notification',
      error: {
        code: err.code || 'NOTIFICATION_SEND_FAILED',
        field: err.field,
      },
    });
  }
};

/**
 * GET /api/notifications/history
 * Retrieve notification delivery audit logs
 */
exports.getHistory = async (req, res) => {
  try {
    const { page, limit, type, status, search } = req.query;
    const history = await notificationService.getHistory({ page, limit, type, status, search });
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification history',
      error: {
        code: 'HISTORY_FETCH_FAILED',
      },
    });
  }
};

/**
 * GET /api/notifications/:id
 * Retrieve notification details by ID
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.getById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `Notification not found with ID "${id}"`,
        error: {
          code: 'NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notification details',
      error: {
        code: 'FETCH_FAILED',
      },
    });
  }
};
