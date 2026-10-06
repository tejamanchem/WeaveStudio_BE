const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

const { validateNotificationInput, isValidEmail, isValidPhone } = require('../src/validators/notificationValidator');
const EmailProvider = require('../src/providers/email/emailProvider');
const NodemailerEmailProvider = require('../src/providers/email/nodemailerEmailProvider');
const SmsProvider = require('../src/providers/sms/smsProvider');
const TwilioSmsProvider = require('../src/providers/sms/twilioSmsProvider');
const { NotificationService } = require('../src/services/notificationService');

describe('Notification Validator', () => {
  test('validates email format correctly', () => {
    assert.strictEqual(isValidEmail('patron@example.com'), true);
    assert.strictEqual(isValidEmail('invalid-email'), false);
    assert.strictEqual(isValidEmail(''), false);
    assert.strictEqual(isValidEmail(null), false);
  });

  test('validates phone format correctly', () => {
    assert.strictEqual(isValidPhone('+919876543210'), true);
    assert.strictEqual(isValidPhone('9876543210'), true);
    assert.strictEqual(isValidPhone('+1 (555) 234-5678'), true);
    assert.strictEqual(isValidPhone('123'), false); // Too short
    assert.strictEqual(isValidPhone(''), false);
  });

  test('rejects missing or unsupported notification type', () => {
    const res1 = validateNotificationInput({});
    assert.strictEqual(res1.isValid, false);
    assert.strictEqual(res1.field, 'type');

    const res2 = validateNotificationInput({ type: 'fax', to: 'test@example.com' });
    assert.strictEqual(res2.isValid, false);
    assert.strictEqual(res2.field, 'type');
  });

  test('rejects missing recipient', () => {
    const res = validateNotificationInput({ type: 'email' });
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.field, 'to');
  });

  test('rejects email with invalid address, missing subject, or missing body', () => {
    const res1 = validateNotificationInput({
      type: 'email',
      to: 'invalid-email',
      subject: 'Hello',
      message: 'Body',
    });
    assert.strictEqual(res1.isValid, false);
    assert.strictEqual(res1.field, 'to');

    const res2 = validateNotificationInput({
      type: 'email',
      to: 'valid@example.com',
      message: 'Body',
    });
    assert.strictEqual(res2.isValid, false);
    assert.strictEqual(res2.field, 'subject');

    const res3 = validateNotificationInput({
      type: 'email',
      to: 'valid@example.com',
      subject: 'Subject',
    });
    assert.strictEqual(res3.isValid, false);
    assert.strictEqual(res3.field, 'message');
  });

  test('rejects SMS with invalid phone or missing message', () => {
    const res1 = validateNotificationInput({
      type: 'sms',
      to: 'abc',
      message: 'Body',
    });
    assert.strictEqual(res1.isValid, false);
    assert.strictEqual(res1.field, 'to');

    const res2 = validateNotificationInput({
      type: 'sms',
      to: '+919876543210',
    });
    assert.strictEqual(res2.isValid, false);
    assert.strictEqual(res2.field, 'message');
  });

  test('accepts valid email and SMS requests', () => {
    const emailRes = validateNotificationInput({
      type: 'email',
      to: ['patron@example.com'],
      subject: 'Your order is crafting',
      message: 'Artisan details inside',
    });
    assert.strictEqual(emailRes.isValid, true);

    const smsRes = validateNotificationInput({
      type: 'sms',
      to: '+919876543210',
      message: 'Your crochet piece is dispatched!',
    });
    assert.strictEqual(smsRes.isValid, true);
  });
});

describe('Email Provider (Nodemailer Adapter)', () => {
  test('dispatches email via mock transporter', async () => {
    let sentPayload = null;
    const mockTransporter = {
      sendMail: async (mailOptions) => {
        sentPayload = mailOptions;
        return { messageId: '<mock-email-id-123@weavestudio>', accepted: [mailOptions.to] };
      },
    };

    const provider = new NodemailerEmailProvider({ transporter: mockTransporter });
    const result = await provider.sendEmail({
      to: 'patron@example.com',
      subject: 'Test Subject',
      message: 'Hello Patron',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, 'nodemailer');
    assert.strictEqual(result.providerMessageId, '<mock-email-id-123@weavestudio>');
    assert.strictEqual(sentPayload.to, 'patron@example.com');
    assert.strictEqual(sentPayload.subject, 'Test Subject');
  });

  test('handles provider error and tags appropriate error code', async () => {
    const mockTransporter = {
      sendMail: async () => {
        const err = new Error('Invalid credentials');
        err.code = 'EAUTH';
        err.responseCode = 535;
        throw err;
      },
    };

    const provider = new NodemailerEmailProvider({ transporter: mockTransporter });
    await assert.rejects(
      async () => {
        await provider.sendEmail({
          to: 'patron@example.com',
          subject: 'Test',
          message: 'Body',
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'PROVIDER_AUTHENTICATION_FAILED');
        return true;
      }
    );
  });
});

describe('SMS Provider (Twilio Adapter)', () => {
  test('dispatches SMS via mock fetcher', async () => {
    let calledUrl = null;
    let calledHeaders = null;
    let calledBody = null;

    const mockFetcher = async (url, options) => {
      calledUrl = url;
      calledHeaders = options.headers;
      calledBody = options.body;
      return {
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SM1234567890abcdef',
          status: 'queued',
          date_created: new Date().toISOString(),
        }),
      };
    };
    mockFetcher.isMock = true;

    // Temporarily mock environment for test
    const originalKey = process.env.SMS_API_KEY;
    const originalSecret = process.env.SMS_API_SECRET;
    process.env.SMS_API_KEY = 'ACmock123';
    process.env.SMS_API_SECRET = 'token123';

    try {
      const provider = new TwilioSmsProvider({ fetcher: mockFetcher });
      const result = await provider.sendSms({
        to: '+919876543210',
        message: 'Order shipped!',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.provider, 'twilio');
      assert.strictEqual(result.providerMessageId, 'SM1234567890abcdef');
      assert.ok(calledUrl.includes('/Messages.json'));
      assert.ok(calledBody.includes('Body=Order+shipped'));
    } finally {
      process.env.SMS_API_KEY = originalKey;
      process.env.SMS_API_SECRET = originalSecret;
    }
  });

  test('normalizes 10-digit Indian numbers to E.164 +91', () => {
    const provider = new TwilioSmsProvider();
    assert.strictEqual(provider.normalizePhoneNumber('9876543210'), '+919876543210');
    assert.strictEqual(provider.normalizePhoneNumber('+15551234567'), '+15551234567');
  });

  test('builds plain-text SMS from supported order use-case templates', async () => {
    let calledBody = null;

    const mockFetcher = async (_url, options) => {
      calledBody = options.body;
      return {
        ok: true,
        status: 201,
        json: async () => ({
          sid: 'SMtemplate123',
          status: 'queued',
          date_created: new Date().toISOString(),
        }),
      };
    };
    mockFetcher.isMock = true;

    const provider = new TwilioSmsProvider({ fetcher: mockFetcher });

    await provider.sendSms({
      to: '+919876543210',
      message: 'fallback message',
      metadata: {
        smsTemplate: 'order_shipped',
        customerName: 'Aarav',
        orderId: 'WS-101',
        trackingUrl: 'https://weavestudio.in/track?order=WS-101',
      },
    });

    assert.ok(calledBody.includes('Body=Hi+Aarav%2C+your+WeaveStudio+order+WS-101+has+been+shipped.'));
    assert.ok(calledBody.includes('track%3Forder%3DWS-101'));
  });

  test('rejects unsupported Twilio template payload fields before dispatch', async () => {
    const mockFetcher = async () => {
      throw new Error('fetch should not be called for unsupported template payloads');
    };
    mockFetcher.isMock = true;

    const provider = new TwilioSmsProvider({ fetcher: mockFetcher });

    await assert.rejects(
      async () => {
        await provider.sendSms({
          to: '+919876543210',
          message: 'Order shipped!',
          templateName: 'order_update',
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'UNSUPPORTED_SMS_TEMPLATE');
        return true;
      }
    );
  });

  test('maps Twilio trial template restriction errors to a specific app error', async () => {
    const mockFetcher = async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Invalid template name. Trial accounts can only use predefined SMS templates.',
      }),
    });
    mockFetcher.isMock = true;

    const provider = new TwilioSmsProvider({ fetcher: mockFetcher });

    await assert.rejects(
      async () => {
        await provider.sendSms({
          to: '+919876543210',
          message: 'Order shipped!',
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'UNSUPPORTED_SMS_TEMPLATE');
        assert.match(err.message, /trial accounts only allow approved sms templates/i);
        return true;
      }
    );
  });
});

describe('Notification Service Orchestration', () => {
  test('routes email and sms requests to respective providers', async () => {
    let emailSent = false;
    let smsSent = false;

    class MockEmailProvider extends EmailProvider {
      async sendEmail() {
        emailSent = true;
        return { success: true, provider: 'mock-email', providerMessageId: 'email_99' };
      }
    }

    class MockSmsProvider extends SmsProvider {
      async sendSms() {
        smsSent = true;
        return { success: true, provider: 'mock-sms', providerMessageId: 'sms_99' };
      }
    }

    const service = new NotificationService({
      emailProvider: new MockEmailProvider(),
      smsProvider: new MockSmsProvider(),
    });

    // Test unified email send
    const emailRes = await service.send({
      type: 'email',
      to: 'patron@example.com',
      subject: 'Hello',
      message: 'Warm atelier updates',
    });
    assert.strictEqual(emailRes.success, true);
    assert.strictEqual(emailSent, true);
    assert.strictEqual(emailRes.data.channel, 'EMAIL');
    assert.ok(emailRes.data.notificationId.startsWith('notif_'));

    // Test unified sms send
    const smsRes = await service.send({
      type: 'sms',
      to: '+919876543210',
      message: 'Dispatched link',
    });
    assert.strictEqual(smsRes.success, true);
    assert.strictEqual(smsSent, true);
    assert.strictEqual(smsRes.data.channel, 'SMS');
  });

  test('security: credentials and secrets are never returned in response data', async () => {
    class MockEmailProvider extends EmailProvider {
      async sendEmail() {
        return {
          success: true,
          provider: 'nodemailer',
          providerMessageId: 'msg_safe_1',
        };
      }
    }

    const service = new NotificationService({
      emailProvider: new MockEmailProvider(),
    });

    const res = await service.send({
      type: 'email',
      to: 'patron@example.com',
      subject: 'Safe Email',
      message: 'Body',
    });

    const jsonStr = JSON.stringify(res);
    assert.strictEqual(jsonStr.includes('password'), false);
    assert.strictEqual(jsonStr.includes('SMTP_PASS'), false);
    assert.strictEqual(jsonStr.includes('API_SECRET'), false);
  });
});
