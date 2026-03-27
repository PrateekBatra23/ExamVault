# ExamVault

A secure online exam system built for CNS lab work. This project provides role-based exam management for faculty and student exam taking, with JWT authentication, JSON persistence, and audit logging.

---

## Features

- Faculty-only exam ownership: faculty can create, view, and delete only their own exams
- Faculty submission scope: faculty see submissions only for their exams
- Student exam attempts: students can list exams, take exams, and submit answers
- Auto grading: automatic scoring and percentage calculation
- Role-based security: route access enforced by middleware
- JWT authentication: token generation, verification, and expiry handling
- Password hashing: bcrypt-secured credentials
- JSON persistence: exam and submission records stored in `server/data/storage`
- Request logging: application operations logged in `logs/app.log`
- Environment configuration: `.env` supports port, JWT secret, expiry, and logging settings

---

## Project Structure

```
secure-exam-system/
├── client/
│   ├── index.html
│   ├── faculty.html
│   └── student.html
├── server/
│   ├── index.js
│   ├── config.js
│   ├── logger.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── faculty.js
│   │   └── student.js
│   └── data/
│       ├── store.js
│       ├── persistence.js
│       └── storage/
│           ├── exams.json
│           └── submissions.json
├── logs/
│   └── app.log
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js v14+
- npm v6+

### Install and run

```bash
cd secure-exam-system
npm install
copy .env.example .env        # Windows
# or cp .env.example .env    # macOS/Linux
npm start
```

Open the app at `http://localhost:3000`

---

## API Endpoints

### Authentication

```
POST /api/auth/login
POST /api/auth/verify
```

### Faculty (role: faculty)

```
GET  /api/faculty/exams
POST /api/faculty/exams
GET  /api/faculty/submissions
GET  /api/faculty/submissions/:examId
GET  /api/faculty/results
DELETE /api/faculty/exams/:id
```

### Student (role: student)

```
GET  /api/student/exams
GET  /api/student/exams/:id
POST /api/student/exams/:id/submit
GET  /api/student/results
```

---

## Configuration

Create `.env` from `.env.example` and update values as needed.

Example values:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret
JWT_EXPIRY=1h
LOG_FILE=logs/app.log
```

---

## CNS Coverage

- Role-based exam access for faculty and students
- Secure authentication using JWT and bcrypt
- Persistent state storage using JSON files
- Separate workflows for student and faculty views
- Minimal UI with backend API for lab demonstration
