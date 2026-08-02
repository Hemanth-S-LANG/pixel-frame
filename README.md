
# Website

Full-stack studio booking platform with Next.js frontend and Express/MongoDB backend.

## Prerequisites

- **Node.js** v18+ installed
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string
- **Razorpay** test API keys (sign up at https://dashboard.razorpay.com)

## Project Structure

```
├── frontend/    # Next.js 15 (TypeScript + Tailwind + shadcn/ui)
├── backend/     # Express.js (TypeScript + MongoDB + Razorpay)
```

---

## 🔧 Setup & Run

### 1. Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (already done if you followed setup)
npm install

# Edit .env with your credentials
# - Set MONGODB_URI to your MongoDB connection string
# - Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Razorpay dashboard

# Start the backend dev server (runs on port 5000)
npm run dev
```

### 2. Frontend

```bash
# Open a NEW terminal, then navigate to frontend
cd frontend

# Install dependencies (already done if you followed setup)
npm install

# Start the frontend dev server (runs on port 3000)
npm run dev
```

### 3. Open in browser

- **Frontend**: http://localhost:3000
- **Booking**: http://localhost:3000/booking
- **Admin Dashboard**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000/api/health

> ⚠️ **Important**: Both servers need to be running at the same time. Use two separate terminal windows.

---

## 🛡️ Admin Dashboard

Visit **http://localhost:3000/admin** to:

- **View stats** — total bookings, today's bookings, revenue, active programs
- **Block an entire day** — mark yourself as "On leave" so no one can book that day
- **Unblock a day** — make yourself available again
- **Block/unblock individual time slots** — fine-grained control
- **View all bookings** — see customer details, dates, amounts, and payment status

The booking calendar will automatically show:
- 🟡 **Yellow dot** — some slots are already booked
- 🔴 **Red dot** — fully blocked / unavailable (owner on leave)
- 🟢 **Gold dot** — available for booking

---

## 📊 Viewing Database Data

Install **MongoDB Compass** (free) from https://www.mongodb.com/products/compass  
Connect with: `mongodb://localhost:27017/cameraman-studio`

You'll see 3 collections:
- **programs** — the 4 studio services
- **timeslots** — all available time slots (auto-generated for 60 days)
- **bookings** — customer bookings with payment info

---

## Razorpay Test Mode

Use these test credentials when making a payment:
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3-digit number
- **OTP**: `1234`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/programs` | List all programs |
| GET | `/api/programs/:id` | Get program details |
| GET | `/api/bookings/available-dates?programId=X&month=YYYY-MM` | Available dates |
| GET | `/api/bookings/available-slots?programId=X&date=YYYY-MM-DD` | Available time slots |
| POST | `/api/bookings` | Create a booking |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |



## Scalability

The backend is production-ready with:
- **Atomic booking** — MongoDB `findOneAndUpdate` prevents double-booking under concurrent load
- **Connection pooling** — 50 concurrent MongoDB connections
- **Rate limiting** — 100 req/min general, 20 req/min for bookings
- **Gzip compression** — faster API responses
- **Security headers** — Helmet middleware
- **Multi-core clustering** — Node.js cluster in production mode (`NODE_ENV=production`)
