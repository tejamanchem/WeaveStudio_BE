const nodemailer = require('nodemailer');
const EmailProvider = require('./emailProvider');
const config = require('../../config/notificationConfig');

class NodemailerEmailProvider extends EmailProvider {
  /**
   * @param {Object} [options]
   * @param {any} [options.transporter] - Optional injected Nodemailer transporter (for tests/mocking)
   */
  constructor(options = {}) {
    super();
    this.name = 'nodemailer';
    this.injectedTransporter = options.transporter || null;
  }

  getTransporter() {
    if (this.injectedTransporter) {
      return this.injectedTransporter;
    }

    const { host, port, secure, user, password } = config.email;

    if (!user || !password) {
      const err = new Error('SMTP credentials (SMTP_USER, SMTP_PASSWORD) are required in .env to send real emails');
      err.code = 'PROVIDER_AUTHENTICATION_FAILED';
      throw err;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Send live email using Nodemailer over SMTP
   * @param {Object} input
   */
  async sendEmail(input) {
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const toAddress = recipients.join(', ');

    try {
      const transporter = this.getTransporter();

      // Format HTML email with WeaveStudio styling if none provided
      let htmlContent = input.html;
      if (!htmlContent && input.message) {
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #FAF8F5; border-radius: 16px; border: 1px solid #EAE3D9;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #EAE3D9;">
              <span style="display: inline-block; background-color: #A34828; color: #ffffff; width: 36px; height: 36px; line-height: 36px; font-weight: bold; font-size: 18px; border-radius: 8px;">W</span>
              <h2 style="margin: 8px 0 0 0; color: #2C2623; font-family: Georgia, serif; font-size: 20px;">WeaveStudio Atelier</h2>
              <p style="margin: 4px 0 0 0; color: #8C533E; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Handmade Crochet Creations</p>
            </div>
            <div style="padding: 24px 0; color: #433D39; font-size: 14px; line-height: 1.6; white-space: pre-line;">
              ${input.message}
            </div>
            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #EAE3D9; font-size: 11px; color: #8F8781;">
              <p style="margin: 0;">Crafted with patience and care by the WeaveStudio Collective</p>
              <p style="margin: 4px 0 0 0;">Have a question? Reply directly to this note or visit <a href="https://weavestudio.in" style="color: #A34828;">weavestudio.in</a></p>
            </div>
          </div>
        `;
      }

      const mailOptions = {
        from: config.email.from || config.email.user,
        to: toAddress,
        subject: input.subject,
        text: input.message || input.text || '',
        html: htmlContent,
      };

      if (input.replyTo) {
        mailOptions.replyTo = input.replyTo;
      }

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent Successfully] To: ${toAddress} | MessageId: ${info.messageId}`);

      return {
        success: true,
        provider: 'nodemailer',
        providerMessageId: info.messageId || `msg_${Date.now()}`,
        details: {
          accepted: info.accepted,
          response: info.response,
        },
      };
    } catch (err) {
      console.error('[Nodemailer Error]:', err.message);

      let code = 'NOTIFICATION_SEND_FAILED';
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        code = 'PROVIDER_AUTHENTICATION_FAILED';
      } else if (err.code === 'EENVELOPE' || err.responseCode === 550) {
        code = 'INVALID_RECIPIENT';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        code = 'PROVIDER_UNAVAILABLE';
      }

      const providerError = new Error(err.message || 'Failed to send email via SMTP');
      providerError.code = code;
      providerError.provider = 'nodemailer';
      throw providerError;
    }
  }
}

module.exports = NodemailerEmailProvider;
