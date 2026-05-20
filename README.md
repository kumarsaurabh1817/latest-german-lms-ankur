# German LMS (DeutschLernen)

Full stack learning management system for German language courses. The project includes a Node.js/Express API with PostgreSQL, and a React + Vite frontend with Stripe and Razorpay payments.

## Features
- Role based auth for students, teachers, and admins
- Course catalog, lessons, and enrollments
- Consultation and contact forms with email notifications
- Stripe and Razorpay checkout with webhook verification
- Admin bootstrap endpoint guarded by a secret header
- Cloudinary image uploads
- Security headers, CORS, rate limiting

## Tech stack
- Backend: Node.js, Express, PostgreSQL, JWT, Stripe, Razorpay, Cloudinary, Nodemailer
- Frontend: React, Vite, Tailwind CSS, React Router, Axios

## Project structure
- backend/ - Express API, database schema and services
- frontend/ - React client app

## Getting started

### Prerequisites
- Node.js (LTS recommended)
- PostgreSQL database
- Stripe CLI (optional, for local webhook testing)

### Backend setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `backend/.env` (see Environment variables below).
3. Run database migration:
   ```bash
   npm run db:migrate
   ```
4. Start the API:
   ```bash
   npm run dev
   ```
   The API runs at http://localhost:5010 by default.

### Frontend setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create `frontend/.env` (see Environment variables below).
3. Start the client:
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:5173 and proxies `/api` to the backend.

## Environment variables

### Backend (`backend/.env`)
| Name | Required | Description |
| --- | --- | --- |
| DATABASE_URL | yes | PostgreSQL connection string |
| PORT | no | API port (default 5010) |
| NODE_ENV | no | Use `production` to enable SSL for hosted DBs |
| CLIENT_URL | no | Frontend URL for CORS (default http://localhost:5173) |
| JWT_SECRET | yes | JWT signing secret |
| JWT_EXPIRES_IN | no | JWT expiry (default 7d) |
| ADMIN_SECRET_KEY | yes | Secret for `/api/admin/create` header `x-admin-secret` |
| ADMIN_EMAIL | no | Admin email to receive notifications |
| EMAIL_HOST | no | SMTP host |
| EMAIL_PORT | no | SMTP port (default 587) |
| EMAIL_SECURE | no | `true` for port 465 TLS, `false` for STARTTLS |
| EMAIL_USER | no | SMTP username |
| EMAIL_PASS | no | SMTP password or app password |
| EMAIL_FROM | no | Override "From" name/address |
| CLOUDINARY_CLOUD_NAME | no | Cloudinary cloud name |
| CLOUDINARY_API_KEY | no | Cloudinary API key |
| CLOUDINARY_API_SECRET | no | Cloudinary API secret |
| CLOUDINARY_FOLDER | no | Base folder (default `lms`) |
| STRIPE_SECRET_KEY | no | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | no | Stripe webhook signing secret |
| ENABLE_STRIPE_WEBHOOK | no | `true` to enable Stripe webhook route |
| RAZORPAY_KEY_ID | no | Razorpay key id |
| RAZORPAY_KEY_SECRET | no | Razorpay key secret |
| RAZORPAY_WEBHOOK_SECRET | no | Razorpay webhook secret |
| ENABLE_RAZORPAY_WEBHOOK | no | `true` to enable Razorpay webhook route |

### Frontend (`frontend/.env`)
| Name | Required | Description |
| --- | --- | --- |
| VITE_API_URL | no | API base URL (default `/api`) |
| VITE_STRIPE_PUBLISHABLE_KEY | no | Stripe publishable key for client |
| VITE_RAZORPAY_KEY_ID | no | Razorpay key id for client |

## Webhooks
- Stripe: POST `/api/payments/stripe/webhook` with raw body. Set `ENABLE_STRIPE_WEBHOOK=true` and `STRIPE_WEBHOOK_SECRET`.
- Razorpay: POST `/api/payments/razorpay/webhook` with raw body. Set `ENABLE_RAZORPAY_WEBHOOK=true` and `RAZORPAY_WEBHOOK_SECRET`.

## API routes
Base path: `/api`
- /auth
- /courses
- /lessons
- /enrollments
- /consultations
- /contact
- /payments
- /users
- /uploads
- /admin

## Admin bootstrap
Create an admin user directly via API (intended for Postman or similar tools):
- POST `/api/admin/create`
- Header: `x-admin-secret: <ADMIN_SECRET_KEY>`
- Body: `{ "name": "Admin", "email": "admin@example.com", "password": "strong-password", "phone": "+91XXXXXXXXXX" }`

## Scripts

### Backend
- `npm run dev` - start API with nodemon
- `npm start` - start API
- `npm run db:migrate` - run SQL migration

### Frontend
- `npm run dev` - start Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
