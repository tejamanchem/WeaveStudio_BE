const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NodemailerEmailProvider = require('../providers/email/nodemailerEmailProvider');
const TwilioSmsProvider = require('../providers/sms/twilioSmsProvider');
const { validateNotificationInput } = require('../validators/notificationValidator');

class NotificationService {
  /**
   * @param {Object} [options]
   * @param {import('../providers/email/emailProvider')} [options.emailProvider]
   * @param {import('../providers/sms/smsProvider')} [options.smsProvider]
   */
  constructor(options = {}) {
    this.emailProvider = options.emailProvider || new NodemailerEmailProvider();
    this.smsProvider = options.smsProvider || new TwilioSmsProvider();
  }

  /**
   * Generate clean unique notification ID
   */
  generateNotificationId() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `notif_${timestamp}_${randomSuffix}`;
  }

  /**
   * Check if MongoDB is connected
   */
  isDbConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Unified notification dispatcher
   * @param {Object} input
   */
  async send(input) {
    const validation = validateNotificationInput(input);
    if (!validation.isValid) {
      const err = new Error(validation.message);
      err.code = 'VALIDATION_ERROR';
      err.field = validation.field;
      throw err;
    }

    const type = String(input.type).trim().toUpperCase();
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const primaryRecipient = recipients[0];
    const notificationId = this.generateNotificationId();

    let notificationRecord = null;
    if (this.isDbConnected()) {
      try {
        notificationRecord = await Notification.create({
          notificationId,
          type,
          recipient: primaryRecipient,
          recipients,
          subject: input.subject || '',
          message: input.message || '',
          html: input.html || '',
          metadata: input.metadata || {},
          status: 'PENDING',
        });
      } catch (dbErr) {
        console.error('[Notification Audit Error]: Failed to create initial audit record:', dbErr.message);
      }
    }

    try {
      let result;

      if (type === 'EMAIL') {
        result = await this.emailProvider.sendEmail({
          to: recipients,
          subject: input.subject,
          message: input.message,
          html: input.html,
          metadata: input.metadata,
        });
      } else if (type === 'SMS') {
        result = await this.smsProvider.sendSms({
          to: recipients,
          message: input.message,
          // metadata: input.metadata,
        });
      } else {
        const err = new Error(`Unsupported notification channel: "${type}"`);
        err.code = 'UNSUPPORTED_NOTIFICATION_TYPE';
        throw err;
      }

      // Update audit record on success
      if (notificationRecord) {
        try {
          await Notification.findByIdAndUpdate(notificationRecord._id, {
            status: 'SENT',
            provider: result.provider,
            providerMessageId: result.providerMessageId,
            sentAt: new Date(),
          });
        } catch (updateErr) {
          console.error('[Notification Audit Error]: Failed to update sent status:', updateErr.message);
        }
      }

      return {
        success: true,
        message: `${type === 'EMAIL' ? 'Email' : 'SMS'} notification sent successfully`,
        data: {
          notificationId,
          status: 'SENT',
          channel: type,
          recipient: primaryRecipient,
          provider: result.provider,
          providerMessageId: result.providerMessageId,
        },
      };
    } catch (sendErr) {
      // Update audit record on failure
      if (notificationRecord) {
        try {
          await Notification.findByIdAndUpdate(notificationRecord._id, {
            status: 'FAILED',
            provider: sendErr.provider || (type === 'EMAIL' ? 'nodemailer' : 'twilio'),
            error: {
              code: sendErr.code || 'NOTIFICATION_SEND_FAILED',
              message: sendErr.message,
            },
          });
        } catch (updateErr) {
          console.error('[Notification Audit Error]: Failed to update failed status:', updateErr.message);
        }
      }

      // Ensure error is properly tagged with application code
      if (!sendErr.code) {
        sendErr.code = 'NOTIFICATION_SEND_FAILED';
      }
      throw sendErr;
    }
  }

  /**
   * Helper to send email directly
   */
  async sendEmail(input) {
    return this.send({ ...input, type: 'email' });
  }

  /**
   * Helper to send SMS directly
   */
  async sendSms(input) {
    return this.send({ ...input, type: 'sms' });
  }

  /**
   * Retrieve notification history / audit log
   * @param {Object} query
   */
  async getHistory({ page = 1, limit = 25, type, status, search }) {
    if (!this.isDbConnected()) {
      return { notifications: [], total: 0, page: 1, totalPages: 1 };
    }

    const filter = {};
    if (type && type !== 'ALL') {
      filter.type = type.toUpperCase();
    }
    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { recipient: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { notificationId: { $regex: q, $options: 'i' } },
        { 'metadata.orderId': { $regex: q, $options: 'i' } },
        { 'metadata.customerName': { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Retrieve single notification by notificationId or MongoDB _id
   * @param {string} id
   */
  async getById(id) {
    if (!this.isDbConnected()) return null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      const notif = await Notification.findById(id);
      if (notif) return notif;
    }

    return Notification.findOne({ notificationId: id });
  }
}

// Export singleton instance with default providers, and class for custom injection
const defaultNotificationService = new NotificationService();
defaultNotificationService.NotificationService = NotificationService;

module.exports = defaultNotificationService;
