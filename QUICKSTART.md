# 🚀 Monocle Quick Start Guide

## What Was Created

### ✅ Project Structure
```
monocle-your-work-compass-main/
├── frontend/          ✓ React + TypeScript app
├── backend/           ✓ Node.js + Express API
└── README.md          ✓ Project documentation
```

### ✅ Backend Features (Complete)

#### 📁 Architecture
- **Config**: MongoDB & Gemini AI setup
- **Types**: TypeScript interfaces
- **Models**: Mongoose schemas (8 models)
- **Services**: Business logic (6 services)
  - User Service
  - Work Thread Service
  - Work Item Service
  - Insight Service (AI-powered)
  - Priority Service
  - Analytics Service
- **Controllers**: API handlers (4 controllers)
- **Routes**: REST endpoints (4 route files)

#### 🍃 MongoDB Integration
- **Database**: MongoDB Atlas configured
- **ORM**: Mongoose for safe data modeling
- **Collections**:
  - users
  - workthreads
  - workitems
  - workinsights
  - priorityrecommendations
  - cognitiveloadstates
  - dailystats
  - activities

#### 🤖 Gemini AI Features
- Smart insight generation
- Priority recommendation reasoning
- Pattern detection
- Actionable suggestions

#### 🌐 API Endpoints (40+ endpoints)

**Users API** (`/api/users`)
- Create, read, update, delete users
- Manage preferences

**Threads API** (`/api/threads`)
- Manage work threads
- Track progress
- Handle deadlines
- Priority management

**Items API** (`/api/items`)
- Create work items (email, messages, docs, etc.)
- Filter by type
- Track read/unread status
- Assign to threads

**Intelligence API** (`/api/intelligence`)
- Generate AI insights
- Get priority recommendations
- Calculate cognitive load
- Track daily stats
- Monitor context switches

## How to Run

### Option 1: Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✓ Backend runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✓ Frontend runs on http://localhost:8080

### Option 2: Quick Test Backend

```bash
cd backend
npm run dev
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Monocle Work Intelligence API is running",
  "timestamp": "2026-01-07T...",
  "environment": "development"
}
```

## Environment Configuration

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://mohan:0110@cluster0.420pvti.mongodb.net/?appName=Cluster0
GEMINI_API_KEY=your-gemini-key
CORS_ORIGIN=http://localhost:8080
```

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_URL=http://localhost:5000/api
```

## Example API Usage

### Create a User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

### Create a Work Thread
```bash
curl -X POST http://localhost:5000/api/threads \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Q4 Budget Planning",
    "description": "Annual budget review",
    "priority": "high",
    "progress": 0,
    "itemIds": [],
    "lastActivity": "2026-01-07T10:00:00Z"
  }'
```

### Generate AI Insights
```bash
curl -X POST http://localhost:5000/api/intelligence/insights/user123/generate
```

## Authentication

The app uses **Native Google OAuth 2.0**:
1. User signs in via Google on the frontend.
2. Frontend sends the Google access token to the backend.
3. Backend verifies the token directly with Google's API via `authMiddleware`.
4. No Firebase required!

## Success! 🎉

You now have a complete full-stack application with:
- ✅ Frontend (React + TypeScript)
- ✅ Backend (Node.js + Express)
- ✅ Database (MongoDB Atlas)
- ✅ AI (Google Gemini)
- ✅ Authentication (Native Google OAuth)
- ✅ 40+ API endpoints

**Both servers should be running:**
- Backend: http://localhost:5000
- Frontend: http://localhost:8080

Visit http://localhost:8080 to see the app! 🚀
