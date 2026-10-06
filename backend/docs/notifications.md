# Notification Platform Documentation — WeaveStudio

Production-structured, provider-agnostic notification platform providing multi-channel dispatch (**Email** and **SMS**) with rate limiting, validation, auditing, and dashboard integration.

---

## 1. Architecture Overview

```
                      Admin Dashboard
                    (Notification Center)
                             │
                             ▼  [POST /api/notifications/send]
                     Notification API
                    (Express + Auth + Rate Limiter)
                             │
                             ▼
                    NotificationService
                 (Orchestrator & Audit Logger)
                      /              \
                     /                \
                    ▼                  ▼
             EmailProvider        SmsProvider
              (Interface)         (Interface)
                    │                  │
                    ▼                  ▼
          Nodemailer Adapter    Twilio SMS Adapter
                    │                  │
                    ▼                  ▼
             SMTP Server         Twilio Gateway
           (Gmail / Host)        (Carrier SMS)
```

### Provider Adapter Pattern
The system is built on abstract interfaces (`EmailProvider` and `SmsProvider`). The controller, service layer, and frontend API contracts are completely decoupled from the third-party providers.

If an email provider or SMS gateway is replaced in the future (e.g. switching to SendGrid, AWS SES, Fast2SMS, MSG91), only a concrete adapter class needs to be added without modifying the API contract, database model, or frontend dashboard.

---

## 2. API Endpoints

All notification endpoints require admin authentication (`Authorization: Bearer <token>`).

### 2.1. Unified Notification Dispatch
`POST /api/notifications/send`

**Rate Limit**: 10 requests / minute (configurable via `NOTIFICATION_RATE_LIMIT_MAX`).

#### Email Payload Example:
```json
{
  "type": "email",
  "to": ["patron@example.com"],
  "subject": "Order #WS-101 Dispatched — WeaveStudio Atelier",
  "message": "Dear Valued Patron,\n\nYour handcrafted crochet rose bouquet has been woven and dispatched.\n\nWarmly,\nWeaveStudio Atelier",
  "metadata": {
    "orderId": "WS-101",
    "customerName": "Aarav Sharma"
  }
}
```

#### SMS Payload Example:
```json
{
  "type": "sms",
  "to": ["+919876543210"],
  "message": "Hi Aarav, your WeaveStudio order #WS-101 is dispatched with love! Track live: https://weavestudio.in/track?order=WS-101",
  "metadata": {
    "orderId": "WS-101",
    "customerName": "Aarav Sharma"
  }
}
```

#### Success Response (HTTP 200):
```json
{
  "success": true,
  "message": "Email notification sent successfully",
  "data": {
    "notificationId": "notif_17912456789_a7b8c9",
    "status": "SENT",
    "channel": "EMAIL",
    "recipient": "patron@example.com",
    "provider": "nodemailer",
    "providerMessageId": "<20261006120000.12345@smtp.gmail.com>"
  }
}
```

#### Validation Error (HTTP 400):
```json
{
  "success": false,
  "message": "Invalid phone number format: \"abc\". Please provide a valid phone number.",
  "error": {
    "code": "VALIDATION_ERROR",
    "field": "to"
  }
}
```

#### Rate Limit Exceeded (HTTP 429):
```json
{
  "success": false,
  "message": "Too many notification requests. Rate limit exceeded. Please try again later.",
  "error": {
    "code": "PROVIDER_RATE_LIMITED",
    "limit": 10,
    "windowMs": 60000
  }
}
```

---

### 2.2. Direct Channel Endpoints
- `POST /api/notifications/email` — Direct email dispatch.
- `POST /api/notifications/sms` — Direct SMS dispatch.

---

### 2.3. Notification Audit History
`GET /api/notifications/history`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25)
- `type`: Filter by channel (`EMAIL`, `SMS`, `ALL`)
- `status`: Filter by delivery status (`SENT`, `FAILED`, `PENDING`)
- `search`: Search recipient, order ID, or customer name

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "67041a...",
        "notificationId": "notif_17912456789_a7b8c9",
        "type": "EMAIL",
        "recipient": "patron@example.com",
        "subject": "Order #WS-101 Dispatched",
        "message": "...",
        "status": "SENT",
        "provider": "nodemailer",
        "providerMessageId": "<20261006120000.12345@smtp.gmail.com>",
        "metadata": {
          "orderId": "WS-101",
          "customerName": "Aarav Sharma"
        },
        "sentAt": "2026-10-06T12:00:01.000Z",
        "createdAt": "2026-10-06T12:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 2.4. Notification Lookup by ID
`GET /api/notifications/:id`
Retrieves a single notification by its `notificationId` or MongoDB `_id`.

---

## 3. Email Provider Setup (Nodemailer + SMTP)

The default email provider uses **Nodemailer** over standard SMTP.

### Step-by-Step Gmail SMTP Configuration:
1. **Visit Google Account**: Go to [https://myaccount.google.com/](https://myaccount.google.com/).
2. **Enable 2-Step Verification**: Under the **Security** tab, ensure 2-Step Verification is turned ON.
3. **Generate App Password**:
   - Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   - Enter an app name, e.g. `WeaveStudio Notifications`.
   - Click **Create**. Google will generate a 16-character password (e.g. `abcd efgh ijkl mnop`).
4. **Update `.env` in `backend`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_gmail_address@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   SMTP_FROM="WeaveStudio Atelier <your_gmail_address@gmail.com>"
   ```
5. **Restart Backend**: Restart your backend server (`npm run dev`).
6. **Local Development Sandbox Mode**:
   - If `SMTP_USER` or `SMTP_PASSWORD` remain as placeholders, the provider automatically falls back to **Sandbox Mode**, simulating delivery and logging to the console without crashing.

---

## 4. SMS Provider Setup (Twilio Gateway)

The default SMS provider uses the official **Twilio REST API**.

### Step-by-Step Twilio Setup:
1. **Create an Account**: Visit [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio) and sign up.
2. **Free Trial Credits**: Twilio provides **~$15 in free trial credits** upon signing up without requiring a paid subscription immediately.
3. **Verify Your Phone Number**: Complete the SMS verification on signup.
4. **Obtain API Credentials**:
   - Go to the [Twilio Console](https://console.twilio.com/).
   - Copy your **Account SID** (this is `SMS_API_KEY`).
   - Copy your **Auth Token** (this is `SMS_API_SECRET`).
5. **Get a Twilio Phone Number**:
   - In the console, click **Get a Twilio phone number** (or under Phone Numbers -> Manage -> Active numbers).
   - Copy the phone number in E.164 format (e.g. `+18005550199`). This is `SMS_SENDER_ID`.
6. **Update `.env` in `backend`**:
   ```env
   SMS_PROVIDER=twilio
   SMS_API_KEY=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SMS_API_SECRET=your_twilio_auth_token_here
   SMS_SENDER_ID=+18005550199
   SMS_BASE_URL=https://api.twilio.com/2010-04-01
   ```
7. **Trial Account Restrictions to Note**:
   - During the trial period, SMS messages include a prefix: *"Sent from your Twilio trial account"*.
   - In trial mode, SMS can only be sent to phone numbers that have been verified under your Twilio account console (**Verified Caller IDs**).
8. **Local Development Sandbox Mode**:
   - If credentials are not configured, the provider automatically operates in **Sandbox Mode**, logging outgoing SMS messages to the console with simulated delivery IDs.

---

## 5. cURL Examples

### Test Email Dispatch:
```bash
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT_TOKEN>" \
  -d '{
    "type": "email",
    "to": ["patron@example.com"],
    "subject": "Handcrafted order update",
    "message": "Hello from WeaveStudio Atelier!"
  }'
```

### Test SMS Dispatch:
```bash
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT_TOKEN>" \
  -d '{
    "type": "sms",
    "to": ["+919876543210"],
    "message": "Hello from WeaveStudio! Your order is crafting."
  }'
```

---

## 6. Security Considerations
- **No Credential Leakage**: Passwords, API tokens, and secret keys are never included in responses or error payloads.
- **Rate Limiting**: Prevents brute-force or carrier quota exhaustion.
- **Protected Endpoints**: All notification APIs require authenticated admin access.
