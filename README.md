# Monocle - Your Work Compass 🔮

A comprehensive work intelligence platform that helps you focus on what matters most by providing AI-powered insights, priority recommendations, and cognitive load management.

## Project Structure

```
monocle-your-work-compass-main/
├── frontend/           # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── ...
│   └── package.json
│
├── backend/            # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.ts
│   └── package.json
│
└── README.md          # This file
```

## Features

### 🎯 Work Thread Management
- Organize work into intelligent threads
- Track progress and deadlines
- Manage priority levels
- Related people and tags

### 📊 AI-Powered Intelligence
- **Smart Insights**: Gemini AI analyzes your work patterns
- **Priority Recommendations**: Get AI-driven suggestions on what to focus on
- **Cognitive Load Monitoring**: Track mental workload and context switching
- **Pattern Detection**: Identify attention leaks, deadline risks, and overload

### 📈 Analytics & Metrics
- Daily productivity statistics
- Focus time tracking
- Context switch monitoring
- Completion rates

### 🔔 Work Items
- Email integration
- Message tracking
- Document management
- Calendar events
- Task management

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **AI**: Google Gemini AI
- **Authentication**: Firebase Auth (ready for integration)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd monocle-your-work-compass-main
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Running the Application

#### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:8080`

### Build for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Configuration

### Backend Environment Variables (backend/.env)
Already configured with:
- Firebase credentials
- Gemini AI API key
- Server port: 5000
- CORS origin: http://localhost:8080

### Frontend
- Vite dev server: port 8080
- API endpoint: http://localhost:5000

## API Documentation

The backend provides RESTful APIs at `http://localhost:5000/api/`:

- **Users**: `/api/users` - User management
- **Threads**: `/api/threads` - Work thread operations
- **Items**: `/api/items` - Work item management
- **Intelligence**: `/api/intelligence` - AI insights and analytics

For detailed API documentation, see [backend/README.md](./backend/README.md)

## Features Overview

### Dashboard
- Welcome greeting with priority item count
- Recommended focus areas (AI-powered)
- Active work threads with progress
- Recent activity feed
- Cognitive load meter
- Real-time insights

### Insights Page
- Focus time trends (charts)
- Task completion statistics
- Context switching analysis
- Active insights with actionable suggestions
- Cognitive load details

### Work Thread Detail
- Complete thread information
- All associated work items
- Progress tracking
- Related people and tags
- Priority management

### Profile Page
- User preferences
- Work hour settings
- Notification preferences
- Theme selection

## Firebase Collections

The backend uses the following Firestore collections:

- `users` - User profiles
- `workThreads` - Work organization
- `workItems` - Individual items
- `workInsights` - AI insights
- `priorityRecommendations` - AI recommendations
- `cognitiveLoad` - Load tracking
- `dailyStats` - Productivity metrics
- `activities` - Activity logs

## AI Capabilities (Gemini)

The Gemini AI provides:
- Insight generation based on work patterns
- Priority recommendation reasoning
- Pattern detection (attention leaks, deadline risks)
- Actionable suggestions

## Development

### Frontend Development
- Hot module replacement enabled
- TypeScript strict mode
- ESLint configured
- Component library with shadcn/ui

### Backend Development
- TypeScript with strict mode
- Nodemon hot reload
- Service layer architecture
- Controller-route pattern

## Contributing

This is a demonstration project showcasing:
- Full-stack TypeScript development
- AI integration with Gemini
- Firebase/Firestore usage
- Modern React patterns
- RESTful API design

## License

ISC

## Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ using React, Node.js, Firebase, and Gemini AI**
