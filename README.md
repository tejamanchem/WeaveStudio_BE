# WeaveStudio — E-Commerce Clothing Store

A full-stack e-commerce MVP with Next.js frontend, Express.js backend, and MongoDB.

---

## Project Structure

```
weavestudio/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/db.js     # MongoDB connection
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, error handling, upload
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (orders, email)
│   │   └── utils/           # Helpers
│   ├── uploads/             # Image upload directory
│   ├── server.js            # Entry point
│   ├── seed.js              # Database seed script
│   └── .env.example
├── frontend/                # Next.js 14 App Router
│   ├── src/
│   │   ├── app/             # Pages (home, products, cart, checkout, track, admin)
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/api.js       # Axios API client
│   │   └── store/           # Zustand cart store
│   └── .env.example
└── README.md
```

---

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **npm** or **yarn**

---

## Setup Instructions

### 1. Clone & Navigate

```bash
cd weavestudio
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from example and edit)
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weavestudio
JWT_SECRET=change_this_to_a_strong_random_string
ADMIN_EMAIL=admin@weavestudio.com
ADMIN_PASSWORD=admin123

# Email (optional - uses Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NOTIFY_EMAIL=owner@weavestudio.com

FRONTEND_URL=http://localhost:3000
```

```bash
# Seed the database with sample products + admin account
npm run seed

# Start server
npm run dev
```

Backend runs at **http://localhost:5000**

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=919999999999
```

```bash
# Start development server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Default Admin Credentials

| Email | Password |
|---|---|
| admin@weavestudio.com | admin123 |

Access admin panel at: **http://localhost:3000/admin/login**

---

## API Documentation

### Products (Public)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (query: `category`, `search`, `page`, `limit`) |
| GET | `/api/products/categories` | Get all categories |
| GET | `/api/products/:id` | Get single product |

### Orders (Public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place order |
| GET | `/api/orders/track` | Track order (query: `orderId` or `phone`) |

#### Place Order Body:

```json
{
  "customerName": "John Doe",
  "phone": "+919999999999",
  "email": "john@example.com",
  "address": "123 Main St, City, 500001",
  "items": [
    { "productId": "...", "quantity": 2 }
  ]
}
```

### Admin (Protected — Bearer token required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Login (returns JWT token) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| POST | `/api/admin/upload` | Upload images (multipart) |
| GET | `/api/admin/orders` | List all orders |
| PATCH | `/api/admin/orders/:id` | Update order status |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

---

## Features

### Customer-Facing
- Product listing with category filtering, search, and pagination
- Product detail page with image gallery
- Shopping cart (Zustand state management)
- Checkout with customer details form
- Order tracking by Order ID or phone number
- WhatsApp contact button
- Mobile-first responsive design

### Admin Dashboard
- JWT-authenticated login
- Dashboard with order statistics
- Order management with status updates (PLACED → SHIPPED → DELIVERED)
- Full product CRUD (create, read, update, delete)
- Image upload support

### Backend
- Clean MVC architecture
- Input validation
- Error handling middleware
- Email notifications on new orders (Nodemailer)
- Stock management (auto-decrement on order)
- Image upload with Multer

---

## Email Setup (Optional)

For Gmail SMTP, you need an **App Password**:
1. Enable 2-Step Verification on your Google Account
2. Go to Security → App passwords
3. Generate a new app password for "Mail"
4. Use that password as `SMTP_PASS`

If email is not configured, orders still work — the email send fails silently.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| State | Zustand |
| Backend | Express.js, Node.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Email | Nodemailer |
| Upload | Multer |
