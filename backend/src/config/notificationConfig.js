/**
 * Notification Platform Configuration
 * Loads settings from environment variables with production-ready defaults.
 */
module.exports = {
  // Email Configuration (Nodemailer / SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'WeaveStudio Atelier <noreply@weavestudio.in>',
    // Sandbox / Mock mode if no credentials configured or in test environment
    isConfigured: () => {
      const user = process.env.SMTP_USER || '';
      const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
      return !!(user && pass && !user.includes('your_email@gmail.com') && !pass.includes('your_app_password'));
    },
  },

  // SMS Configuration (Twilio / Gateway adapter)
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    apiKey: process.env.SMS_API_KEY || '', // Twilio Account SID
    apiSecret: process.env.SMS_API_SECRET || '', // Twilio Auth Token
    senderId: process.env.SMS_SENDER_ID || '+18005550199', // From phone number or Alphanumeric Sender ID
    baseUrl: process.env.SMS_BASE_URL || 'https://api.twilio.com/2010-04-01',
    isConfigured: () => {
      const key = process.env.SMS_API_KEY || '';
      const secret = process.env.SMS_API_SECRET || '';
      return !!(key && secret && !key.startsWith('your_') && !secret.startsWith('your_'));
    },
  },

  // Rate Limiting Settings
  rateLimit: {
    windowMs: parseInt(process.env.NOTIFICATION_RATE_LIMIT_WINDOW_MS || '60000', 10), // default 1 min
    max: parseInt(process.env.NOTIFICATION_RATE_LIMIT_MAX || '10', 10), // default 10 requests per minute
  },
};
