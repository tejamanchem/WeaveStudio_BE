/**
 * EmailProvider Abstract Base Interface
 * Provider-agnostic contract for email delivery.
 */
class EmailProvider {
  /**
   * Send an email through the underlying provider
   * @param {Object} input
   * @param {string|string[]} input.to - Recipient email or array of emails
   * @param {string} input.subject - Email subject
   * @param {string} [input.text] - Plain text body
   * @param {string} [input.html] - HTML body
   * @param {string} [input.replyTo] - Optional Reply-To address
   * @param {Record<string, any>} [input.metadata] - Additional contextual metadata
   * @returns {Promise<{ success: boolean, provider: string, providerMessageId?: string, error?: string }>}
   */
  async sendEmail(input) {
    throw new Error('sendEmail() must be implemented by concrete EmailProvider subclass');
  }
}

module.exports = EmailProvider;
