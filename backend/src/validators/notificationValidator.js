/**
 * Notification Request Validator
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supports international E.164, +91, local 10-digit Indian numbers, etc.
const PHONE_REGEX = /^\+?[0-9\s\-().]{8,20}$/;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/[^\d]/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15 && PHONE_REGEX.test(phone.trim());
}

/**
 * Validate input for send notification
 * @param {Object} body
 * @returns {{ isValid: boolean, message?: string, field?: string }}
 */
function validateNotificationInput(body = {}) {
  const { type, to, subject, message, html } = body;

  if (!type) {
    return { isValid: false, field: 'type', message: 'Notification type is required ("email" or "sms")' };
  }

  const normalizedType = String(type).trim().toLowerCase();
  if (normalizedType !== 'email' && normalizedType !== 'sms') {
    return {
      isValid: false,
      field: 'type',
      message: `Unsupported notification type "${type}". Allowed types: "email", "sms"`,
    };
  }

  if (!to || (Array.isArray(to) && to.length === 0)) {
    return { isValid: false, field: 'to', message: 'Recipient "to" field is required' };
  }

  const recipients = Array.isArray(to) ? to : [to];

  if (normalizedType === 'email') {
    for (const recipient of recipients) {
      if (!isValidEmail(recipient)) {
        return {
          isValid: false,
          field: 'to',
          message: `Invalid email address format: "${recipient}"`,
        };
      }
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return { isValid: false, field: 'subject', message: 'Subject is required for email notifications' };
    }

    if (subject.length > 255) {
      return { isValid: false, field: 'subject', message: 'Subject cannot exceed 255 characters' };
    }

    if ((!message || !message.trim()) && (!html || !html.trim())) {
      return { isValid: false, field: 'message', message: 'Message content or HTML body is required for email' };
    }

    if (message && message.length > 20000) {
      return { isValid: false, field: 'message', message: 'Message content cannot exceed 20,000 characters' };
    }
  }

  if (normalizedType === 'sms') {
    for (const recipient of recipients) {
      if (!isValidPhone(recipient)) {
        return {
          isValid: false,
          field: 'to',
          message: `Invalid phone number format: "${recipient}". Please provide a valid phone number.`,
        };
      }
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return { isValid: false, field: 'message', message: 'Message body is required for SMS' };
    }

    if (message.length > 1600) {
      return { isValid: false, field: 'message', message: 'SMS message length cannot exceed 1,600 characters' };
    }
  }

  return { isValid: true };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  validateNotificationInput,
};
