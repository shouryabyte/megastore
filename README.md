# NexChakra Electronics, Drone & AC Mega Store Platform

Production-ready MERN (TypeScript) marketplace monorepo:

- `frontend/`: React + Vite + Tailwind + modern UI + TanStack Query + Zustand + Framer Motion + Socket.io client
- `backend/`: Node.js + Express + TypeScript + MongoDB (Mongoose) + Socket.io + Cloudinary + Razorpay

## Features

- Multi-vendor marketplace (vendor onboarding + admin approval)
- Product catalog (categories, specs, compatibility, bulk pricing tiers, vendor storefronts)
- Search + filters (brand, vendor, price, compatibility, specs)
- Cart + wishlist with real-time updates
- Orders with vendor assignment, stock tracking, low-stock alerts, invoices (PDF)
- Payments via Razorpay (create order, verify payment, transactions linked to orders)
- Reviews + vendor ratings
- Commission tracking and analytics dashboards (admin + vendor)
- Notifications (real-time + persisted)
- Secure auth (JWT access + refresh tokens, bcrypt hashing, role-based authorization)
- Security middleware (helmet, CORS, rate limiting, input validation)

## Monorepo structure

```
backend/
frontend/
```

## Prerequisites

- Node.js 20+
- MongoDB Atlas cluster
- Cloudinary account
- Razorpay account

## Installation

```bash
npm install
```

### Backend environment variables

Create `backend/.env`:

```bash
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_me_with_long_random
JWT_REFRESH_SECRET=replace_me_with_long_random
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_TEST_MODE=true
# Comma-separated allowed origins (Vercel prod/preview + localhost)
FRONTEND_URL=http://localhost:5173
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_me_with_long_random_password
```

`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` are optional and seed an admin user for that email if it doesn’t exist yet.

### Frontend environment variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY=your_key_id
```

## Local development

Run both apps:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## MongoDB Atlas setup

1. Create a cluster and a database user.
2. Add your IP (or `0.0.0.0/0` for development only).
3. Copy the connection string into `MONGO_URI`.

## Cloudinary setup

1. Create a Cloudinary account and a new project.
2. Copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` into `backend/.env`.

## Razorpay setup

1. Create a Razorpay account.
2. Use Test mode keys for development.
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
4. Set `VITE_RAZORPAY_KEY` in `frontend/.env` (public key id).

## Deployment

### Backend → Render

1. Create a new **Web Service** from your repository.
2. Root directory: `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Add environment variables from `backend/.env` (set `FRONTEND_URL` to your Vercel domain).
6. Ensure Render Node version is 20+.

### Frontend → Vercel

1. Import repository in Vercel.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env vars: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_RAZORPAY_KEY` (point URLs to Render backend).
6. SPA rewrites are included in `frontend/vercel.json`.

## Production notes

- Refresh tokens are stored as httpOnly cookies (set `sameSite` and `secure` automatically in production).
- CORS is restricted to the comma-separated `FRONTEND_URL` allowlist.
- Socket.io runs on the same Express server instance.
