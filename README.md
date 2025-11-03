# Health Tracker System

A comprehensive healthcare management system for tracking patient enrollments, program sessions, medication dispensations, and attendance records.

## 🎯 Features

- **User Management**: Role-based access control (Admin, Staff, Patient, Guest)
- **Program Management**: Create and manage health programs with sessions
- **Patient Enrollment**: Enroll patients into programs and track progress
- **Session Attendance**: Record and track patient session attendance (attended, missed, cancelled)
- **Medication Tracking**: Assign medications to patients/programs and track dispensations
- **Dashboard Analytics**: Real-time statistics and progress reports
- **CSV Export**: Download patient progress reports

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HP_MT
```

### 2. Backend Setup

```bash
cd backend/health-tracker-backend
npm install
```

Create a `.env` file in `backend/health-tracker-backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=health_tracker
JWT_SECRET=your_jwt_secret_key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../../frontend/health-tracker-frontend
npm install
```

Create a `.env.local` file in `frontend/health-tracker-frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Database Setup

Ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE health_tracker;
```

The database schema will be automatically created on first run (synchronize is enabled).

### 5. Seed the Database

```bash
cd backend/health-tracker-backend
npm run seed
```

This creates initial users:
- **Admin**: `admin@healthtracker.com` / `Admin@123`
- **Staff**: `staff@healthtracker.com` / `Staff@123`
- **Guest**: `guest@healthtracker.com` / `Guest@123`
- **Patients**: `patient1@healthtracker.com` / `Patient@123`, etc.

### 6. Run the Application

**Backend** (Terminal 1):
```bash
cd backend/health-tracker-backend
npm run start:dev
```
Backend runs on `http://localhost:3001`
API docs available at `http://localhost:3001/api/docs`

**Frontend** (Terminal 2):
```bash
cd frontend/health-tracker-frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

## 📁 Project Structure

```
HP_MT/
├── backend/health-tracker-backend/
│   ├── src/
│   │   ├── auth/          # Authentication & authorization
│   │   ├── users/         # User management
│   │   ├── patients/      # Patient records
│   │   ├── programs/      # Health programs
│   │   ├── enrollments/   # Patient enrollments
│   │   ├── sessions/       # Session attendance records
│   │   ├── medications/   # Medication management
│   │   ├── dispensations/ # Medication dispensing
│   │   └── dashboard/     # Analytics & reports
│   └── seed.ts            # Database seeding script
│
└── frontend/health-tracker-frontend/
    └── src/
        ├── app/
        │   ├── (auth)/     # Authentication pages
        │   ├── (dashboard)/# Dashboard pages
        │   └── components/ # Reusable components
        └── contexts/       # React contexts
```

## 👥 User Roles

- **Admin**: Full system access - manage programs, users, patients, enrollments
- **Staff**: Patient tracking, session attendance, medication dispensation
- **Patient**: View programs, book sessions for enrolled programs
- **Guest**: Browse available programs

## 📝 Key Features Explained

- **Attendance Tracking**: Staff can record sessions and mark them as attended, missed, or cancelled. Attendance rates are calculated automatically.
- **Medication Dispensation**: Prevents duplicate dispensing based on frequency (daily, weekly, monthly).
- **Progress Reports**: Export patient progress as CSV including attendance and medication history.
- **Session Booking**: Patients can book sessions for programs they're enrolled in.

## 🔐 API Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📚 API Documentation

Once the backend is running, visit:
```
http://localhost:3001/api/docs
```

## 🐛 Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and `.env` credentials are correct
- **CORS errors**: Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- **Port conflicts**: Change `PORT` in backend `.env` or frontend dev server port

## 📄 License

This project is private/proprietary.
