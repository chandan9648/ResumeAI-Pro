# ResumeAI Pro 📄⚡
> AI-powered Resume Builder & ATS Optimizer — Full Stack SaaS

## Tech Stack
- **Frontend**: React.js (Vite) + Tailwind CSS + Framer Motion + Zustand
- **Backend**: Node.js + Express.js + MongoDB (Mongoose)
- **AI**: OpenAI GPT-4o (with mock fallback for dev)
- **Auth**: JWT + bcrypt
- **Payments**: Razorpay (with mock mode for dev)

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local: `mongodb://localhost:27017` or Atlas)

### 1. Backend Setup
```bash
cd backend
# Copy and fill environment variables
copy .env.example .env

# Install dependencies (already done)
npm install

# Start server
npm start
```
Server runs at: `http://localhost:3000`

### 2. Frontend Setup
```bash
cd frontent
# Copy and fill environment variables
copy .env.example .env

# Install dependencies (already done)
npm install

# Start dev server
npm run dev
```
App runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o) |
| `RAZORPAY_KEY_ID` | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret |
| `CLIENT_URL` | Frontend URL for CORS |

### Frontend (`frontent/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay frontend key |

> **Note:** If `OPENAI_API_KEY` is not set, the app uses intelligent mock AI responses for development.
> If Razorpay keys are not set, payments work in mock mode (auto-approve).

---

## API Endpoints

### Auth
```
POST /api/auth/register     — Create account
POST /api/auth/login        — Login
GET  /api/auth/profile      — Get profile (auth required)
PUT  /api/auth/profile      — Update profile (auth required)
```

### Resume
```
GET    /api/resume/          — Get all resumes
POST   /api/resume/upload    — Upload & parse resume (multipart/form-data)
POST   /api/resume/optimize  — AI-optimize resume with JD
GET    /api/resume/:id       — Get resume by ID
PUT    /api/resume/:id       — Update resume sections
POST   /api/resume/:id/duplicate — Duplicate resume
DELETE /api/resume/:id       — Delete resume
```

### Job Description
```
POST /api/jd/analyze  — Analyze JD with AI
GET  /api/jd/         — Get all JDs
DELETE /api/jd/:id    — Delete JD
```

### Payment
```
POST /api/payment/create-order  — Create Razorpay order
POST /api/payment/verify        — Verify payment & upgrade plan
GET  /api/payment/history       — Get payment history
```

### Admin (admin role required)
```
GET    /api/admin/users            — List all users
GET    /api/admin/analytics        — Platform stats & revenue
PATCH  /api/admin/users/:id/plan   — Change user plan
DELETE /api/admin/users/:id        — Delete user
```

---

## Free Upload Limit

Free users can upload **2 resumes**. On the 3rd attempt:
- Backend returns `403 { limitReached: true }`
- Frontend shows the **Subscription Modal** automatically
- After upgrading, the limit is removed

---

## ATS Scoring Algorithm

| Factor | Weight | Description |
|--------|--------|-------------|
| Keyword Match | 35% | Keywords from JD found in resume |
| Skill Match | 25% | JD skills found in resume skills section |
| Section Completeness | 20% | Required sections present and filled |
| Formatting | 10% | Clear headers, no tables, good structure |
| Readability | 10% | Appropriate sentence length |

---

## Project Structure

```
ResumeAI-Pro/
├── backend/
│   ├── config/          — DB & OpenAI config
│   ├── controllers/     — Route handlers
│   ├── middleware/       — Auth, upload, rate limiter
│   ├── models/          — MongoDB schemas
│   ├── routes/          — Express routers
│   ├── services/        — PDF/DOCX parsers, OpenAI service
│   ├── utils/           — ATS calculator, response handler
│   ├── uploads/         — Temp file storage (auto-cleaned)
│   ├── .env             — Environment variables
│   └── server.js        — Entry point
│
└── frontent/
    ├── src/
    │   ├── components/  — Reusable UI components
    │   ├── pages/       — Route pages
    │   ├── services/    — API service wrappers
    │   ├── store/       — Zustand state stores
    │   └── App.jsx      — Router & layout
    ├── .env             — Frontend env vars
    └── vite.config.js   — Vite config
```

---

## Admin Access

To make yourself an admin, update your MongoDB user document:
```bash
# Connect to MongoDB and run:
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

Then navigate to `/admin` in the app.
