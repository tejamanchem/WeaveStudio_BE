const SmsProvider = require('./smsProvider');
const config = require('../../config/notificationConfig');

class TwilioSmsProvider extends SmsProvider {
  /**
   * @param {Object} [options]
   * @param {Function} [options.fetcher] - Custom fetch function for testing/mocking
   */
  constructor(options = {}) {
    super();
    this.name = 'twilio';
    this.fetcher = options.fetcher || globalThis.fetch;
  }

  /**
   * Format phone number to clean E.164 string
   * @param {string} phone
   */
  normalizePhoneNumber(phone) {
    const cleaned = String(phone).replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    // Default to +91 (India) if 10 digits provided
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  }

  /**
   * Trial-safe adapter only supports plain SMS body dispatch.
   * Reject template-oriented payloads before they reach Twilio.
   * @param {Object} input
   */
  assertSupportedPayload(input = {}) {
    const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
    const templateName = input.templateName || metadata.templateName;
    const contentSid = input.contentSid || metadata.contentSid;
    const contentVariables = input.contentVariables || metadata.contentVariables;

    if (templateName || contentSid || contentVariables) {
      const err = new Error(
        'This SMS integration only supports plain text messages. Remove templateName/contentSid fields or upgrade the provider flow for Twilio Content templates.'
      );
      err.code = 'UNSUPPORTED_SMS_TEMPLATE';
      err.provider = 'twilio';
      throw err;
    }
  }

  /**
   * Build a plain-text SMS body for the current use case.
   * This stays app-side and does not use Twilio Content templates.
   * @param {Object} input
   */
  resolveMessageBody(input = {}) {
    const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
    const smsTemplate = String(metadata.smsTemplate || '').trim().toLowerCase();
    const customerName = metadata.customerName ? String(metadata.customerName).trim() : 'Customer';
    const orderId = metadata.orderId ? String(metadata.orderId).trim() : 'your order';
    const trackingUrl = metadata.trackingUrl ? String(metadata.trackingUrl).trim() : '';

    if (smsTemplate === 'order_placed') {
      return `Hi ${customerName}, your WeaveStudio order ${orderId} has been placed successfully.`;
    }

    if (smsTemplate === 'order_shipped') {
      return trackingUrl
        ? `Hi ${customerName}, your WeaveStudio order ${orderId} has been shipped. Track it here: ${trackingUrl}`
        : `Hi ${customerName}, your WeaveStudio order ${orderId} has been shipped.`;
    }

    if (smsTemplate === 'order_delivered') {
      return `Hi ${customerName}, your WeaveStudio order ${orderId} has been delivered. Thank you for shopping with us.`;
    }

    return input.message;
  }

  /**
   * Send live SMS using Twilio REST API
   * @param {Object} input
   */
  async sendSms(input) {
    this.assertSupportedPayload(input);

    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const recipient = this.normalizePhoneNumber(recipients[0]);

    const accountSid = config.sms.apiKey;
    const authToken = config.sms.apiSecret;
    const fromNumber = config.sms.senderId;
    const messageBody = this.resolveMessageBody(input);

    if (!this.fetcher.isMock) {
      if (!accountSid || !authToken || accountSid.includes('your_twilio') || authToken.includes('your_twilio')) {
        const err = new Error(
          'Twilio SMS credentials (SMS_API_KEY, SMS_API_SECRET, SMS_SENDER_ID) are required in .env to send real SMS'
        );
        err.code = 'PROVIDER_AUTHENTICATION_FAILED';
        err.provider = 'twilio';
        throw err;
      }
    }

    const url = `${config.sms.baseUrl}/Accounts/${accountSid}/Messages.json`;

    try {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', recipient);
      formData.append('From', fromNumber);
      formData.append('Body', messageBody);

      const response = await this.fetcher(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        let code = 'NOTIFICATION_SEND_FAILED';
        if (response.status === 401) {
          code = 'PROVIDER_AUTHENTICATION_FAILED';
        } else if (response.status === 400 && (data.code === 21211 || data.code === 21614)) {
          code = 'INVALID_RECIPIENT';
        } else if (
          response.status === 400 &&
          typeof data.message === 'string' &&
          /invalid template name|trial accounts can only use predefined sms templates/i.test(data.message)
        ) {
          code = 'UNSUPPORTED_SMS_TEMPLATE';
        } else if (response.status === 429) {
          code = 'PROVIDER_RATE_LIMITED';
        } else if (response.status >= 500) {
          code = 'PROVIDER_UNAVAILABLE';
        }

        const errMessage =
          code === 'UNSUPPORTED_SMS_TEMPLATE'
            ? 'Twilio trial accounts only allow approved SMS templates. Send a plain text SMS to a verified number or upgrade the Twilio account.'
            : data.message || `Twilio SMS dispatch failed with status ${response.status}`;

        const err = new Error(errMessage);
        err.code = code;
        err.provider = 'twilio';
        throw err;
      }

      console.log(`[SMS Sent Successfully] To: ${recipient} | SID: ${data.sid}`);

      return {
        success: true,
        provider: 'twilio',
        providerMessageId: data.sid || `sms_${Date.now()}`,
        details: {
          status: data.status,
          dateCreated: data.date_created,
        },
      };
    } catch (err) {
      console.error('[Twilio SMS Error]:', err.message);
      if (!err.code) {
        err.code = 'NOTIFICATION_SEND_FAILED';
        err.provider = 'twilio';
      }
      throw err;
    }
  }
}

module.exports = TwilioSmsProvider;
