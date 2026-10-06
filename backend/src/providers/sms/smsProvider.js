/**
 * SmsProvider Abstract Base Interface
 * Provider-agnostic contract for SMS text delivery.
 */
class SmsProvider {
  /**
   * Send an SMS text message through the underlying gateway
   * @param {Object} input
   * @param {string|string[]} input.to - Recipient phone number or array of phone numbers
   * @param {string} input.message - Plain text message
   * @param {Record<string, any>} [input.metadata] - Additional contextual metadata
   * @returns {Promise<{ success: boolean, provider: string, providerMessageId?: string, error?: string }>}
   */
  async sendSms(input) {
    throw new Error('sendSms() must be implemented by concrete SmsProvider subclass');
  }
}

module.exports = SmsProvider;
