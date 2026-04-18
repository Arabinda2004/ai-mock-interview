# 🚀 AI Interview Platform

A comprehensive AI-powered interview practice platform built with React, Node.js, and a self-hosted FastAPI ML service.

## ✨ Current Features (Completed)

### Authentication & User Management

- ✅ **User Registration** - Secure signup with validation
- ✅ **JWT Authentication** - Token-based secure login system
- ✅ **Profile Management** - View and update user profiles
- ✅ **Password Security** - bcrypt hashing with salt rounds

### Interview Setup & Configuration

- ✅ **Multi-step Interview Setup** - Intuitive wizard-style configuration
- ✅ **Customizable Job Roles** - Full Stack, Frontend, Backend, Data Science, DevOps, Mobile, and more
- ✅ **Dynamic Skill Selection** - Role-based skill suggestions with custom additions
- ✅ **Experience Levels** - Entry, Mid, Senior, Lead level targeting
- ✅ **Multiple Interview Types** - Technical, Behavioral, and Mixed interviews
- ✅ **Flexible Duration** - 10-120 minute interview sessions

### AI-Powered Interview System

- ✅ **AI Question Generation** - Intelligent question generation via question bank + ML-compatible service layer
- ✅ **Contextual Questions** - Role and skill-specific question generation
- ✅ **Dynamic Difficulty** - Experience-based question complexity
- ✅ **Follow-up Questions** - AI-generated contextual follow-ups
- ✅ **Real-time Evaluation** - Instant AI feedback on answers
- ✅ **Multi-criteria Scoring** - Technical accuracy, communication, completeness

### Interview Experience

- ✅ **Live Interview Interface** - Professional interview environment
- ✅ **Video Preview** - WebRTC camera integration
- ✅ **Dual Input Modes** - Text and voice response options
- ✅ **Progress Tracking** - Real-time timer and question counter
- ✅ **Auto-save** - Automatic answer preservation
- ✅ **Session Management** - Resume incomplete interviews

### Results & Analytics

- ✅ **Comprehensive Scoring** - Overall, technical, communication, and confidence scores
- ✅ **Detailed Feedback** - AI-generated improvement suggestions
- ✅ **Performance Analytics** - Historical tracking with charts
- ✅ **Strengths & Weaknesses** - Personalized insights
- ✅ **Interview History** - Complete session replay and review
- ✅ **Skill Progress** - Track improvement over time
- ✅ **Statistics Dashboard** - Visual performance metrics

### Technical Features

- ✅ **Responsive Design** - Mobile-friendly professional UI
- ✅ **Error Handling** - Comprehensive debugging and user-friendly messages
- ✅ **Real-time Updates** - Socket.io integration
- ✅ **Caching** - Redis-based performance optimization
- ✅ **Rate Limiting** - API protection and abuse prevention
- ✅ **Logging** - Winston-based application logging
- ✅ **Security** - Helmet headers, CORS, input validation

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern functional components with hooks
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client (with native Fetch fallback)
- **Chart.js & Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form state management
- **React Hot Toast** - Toast notifications
- **React Webcam** - Video/camera integration
- **RecordRTC** - Media recording capabilities
- **Socket.io Client** - Real-time communication

### Backend

- **Node.js with Express.js** - RESTful API server
- **MongoDB with Mongoose** - Primary database for interview data
- **PostgreSQL with Sequelize** - Relational data (optional)
- **Redis** - Caching and session management (with in-memory fallback)
- **FastAPI ML Service** - Self-hosted answer evaluation and feedback generation
- **JWT with bcrypt** - Secure authentication
- **Socket.io** - Real-time bidirectional communication
- **Winston** - Application logging
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting
- **Express Validator & Joi** - Input validation
- **Multer** - File upload handling
- **Cookie Parser** - Cookie management

## 🛠️ Technology Stack

### Frontend

- **React 18** with modern hooks and functional components
- **React Router** for client-side routing
- **Chart.js & Recharts** for data visualization
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **WebRTC** for video functionality
- **Socket.io Client** for real-time features

### Backend

- **Node.js** with Express.js framework
- **PostgreSQL** for relational data (users, interviews, results)
- **MongoDB** for document storage (interview content, questions)
- **Redis** for caching and session management
- **Socket.io** for real-time communication
- **FastAPI ML Service** for answer evaluation and scoring
- **JWT** for authentication
- **Winston** for logging

## 📦 Project Structure

```
ai-interview-platform/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service functions
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # CSS and styling files
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── config/          # Database and service configurations
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Main server file
│   ├── logs/                # Application logs
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

**Required:**

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher) - **Required**
- Python (v3.10 or higher) - **Required for local ML service**

**Optional (with fallback):**

- PostgreSQL (v12 or higher) - Optional, graceful degradation
- Redis (v6 or higher) - Optional, in-memory fallback available

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-interview-platform
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Copy environment file and configure
   cp .env.example .env
   # Edit .env with your database credentials and API keys

   # Start the backend server
   npm run dev
   ```

3. **ML Service Setup (FastAPI)**

   ```bash
   cd ml-service
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

   # Start ML service on port 8000
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Frontend Setup**

   ```bash
   cd ../../frontend
   npm install

   # Start the frontend development server
   npm start
   ```

5. **Database Setup**
   - Create PostgreSQL database: `ai_interview_platform`
   - Create MongoDB database: `interview-content`
   - Run backend server to auto-create tables/collections

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# PostgreSQL Database Configuration (Optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_interview_platform
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# MongoDB Configuration (Primary Database)
MONGODB_URI=mongodb://localhost:27017/interview-content

# Redis Configuration (Optional - for caching)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# ML Service Configuration
ML_SERVICE_ENABLED=true
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=3500
ML_MODEL_NAME=deberta-v3-base
ML_INFERENCE_MODE=heuristic

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
```

**Important Notes:**

- MongoDB is **required** for core functionality
- PostgreSQL and Redis are **optional** (graceful fallback available)
- Change `JWT_SECRET` to a strong random string in production
- Start the FastAPI ML service before running interview evaluation endpoints

## 📋 API Documentation

### Authentication Endpoints (`/api/auth`)

- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/logout` - User logout and token invalidation
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/auth/profile` - Get detailed user profile
- `PUT /api/auth/profile` - Update user profile information

### Interview Management (`/api/interviews`)

- `POST /api/interviews/questions/generate` - Generate AI questions for new interview
- `POST /api/interviews/:interviewId/answer` - Submit answer during interview
- `POST /api/interviews/:interviewId/submit` - Complete and submit interview
- `POST /api/interviews/:interviewId/followup` - Generate contextual follow-up question
- `GET /api/interviews/history` - Get user's interview history (paginated)
- `GET /api/interviews/statistics` - Get user performance statistics
- `GET /api/interviews/:interviewId/summary` - Get interview summary with scores
- `GET /api/interviews/:interviewId` - Get specific interview details
- `DELETE /api/interviews/:interviewId` - Delete interview session

### AI Services (`/api/ai`)

- `POST /api/ai/generateQuestions` - Generate interview questions using ML-compatible adapter
- `POST /api/ai/reviewAnswer` - Evaluate answer with AI feedback

### Question Generation (`/api/questions`)

- `POST /api/questions/generate` - Generate AI questions for interview
- `GET /api/questions/interview/:id` - Get questions for specific interview

### Answer Submission (`/api/answers`)

- `POST /api/answers/submit` - Submit user answer with metadata
- `GET /api/answers/interview/:interviewId` - Get all answers for interview

### Evaluation System (`/api/evaluation`)

- `POST /api/evaluate/answer` - Evaluate user's answer with AI
- `GET /api/evaluate/results/:interviewId` - Get comprehensive evaluation results

### Results & Analytics (`/api/results`, `/api/analytics`)

- `GET /api/results/:interviewId` - Get complete interview results
- `GET /api/analytics/performance` - Get performance analytics over time
- `GET /api/analytics/skills-progress` - Get skill-wise improvement metrics

### System Health

- `GET /health` - Server health check with service status
- `GET /api/status` - Detailed API status and diagnostics

## 🎯 Core Features Implementation

### 1. Interview Setup

- Dynamic job role selection with skill filtering
- Experience level-based question difficulty
- Customizable interview duration and question count

### 2. AI Question Generation

- Integration with self-hosted ML service adapter
- Role-specific question generation
- Progressive difficulty distribution
- Fallback mechanism for API failures

### 3. Real-time Interview Interface

- WebRTC video preview
- Timer and progress tracking
- Dual input modes (text/voice)
- Auto-save functionality

### 4. AI Evaluation System

- Comprehensive answer analysis
- Detailed feedback generation
- Multi-criteria scoring (technical accuracy, communication, completeness)
- Missing-concept detection and actionable improvement tips

### 5. Performance Analytics

- Historical performance tracking
- Skill-wise improvement charts
- Difficulty progression analysis
- Export functionality

## �️ Security Features

- ✅ **Password Security** - bcrypt hashing with salt rounds (12)
- ✅ **JWT Authentication** - Token-based authentication with expiration
- ✅ **Input Validation** - Express Validator & Joi schemas
- ✅ **Rate Limiting** - Configurable request limits per IP
- ✅ **CORS Protection** - Configured origin whitelist
- ✅ **Helmet.js** - Security headers (CSP, XSS, etc.)
- ✅ **SQL Injection Prevention** - Parameterized queries with Sequelize
- ✅ **NoSQL Injection Prevention** - Mongoose sanitization
- ✅ **Error Sanitization** - Production error messages sanitized
- ✅ **Cookie Security** - HttpOnly, Secure, SameSite cookies
- ✅ **Request Size Limiting** - 10MB payload limit
- ✅ **Environment Protection** - Secrets in environment variables

## 📊 Performance Optimizations

- Redis caching for frequently accessed data
- Database query optimization
- Connection pooling
- Lazy loading for React components
- Image and asset optimization
- Gzip compression

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Build

**Frontend:**

```bash
cd frontend
npm run build
# Output: build/ directory ready for deployment
```

**Backend:**

```bash
cd backend
NODE_ENV=production npm start
```

### Docker Deployment (Coming Soon)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Configure production database URLs
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up monitoring and logging

## 📈 Future Enhancements

- Multi-language support
- Video call interviews with AI avatars
- Industry-specific interview templates
- Integration with job boards
- Mobile application development
- Advanced analytics with ML insights
- Real-time collaboration features
- Voice analysis and emotion detection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For issues, questions, or feature requests:

- Create an issue in the GitHub repository
- Contact: [your-email@example.com](mailto:your-email@example.com)
- Documentation: See [ARCHITECTURE.md](backend/ARCHITECTURE.md) for technical details

## 🚀 Deployment

### Production Build

**Frontend:**

```bash
cd frontend
npm run build
# Output: build/ directory ready for deployment
```

**Backend:**

```bash
cd backend
NODE_ENV=production npm start
```

### Docker Deployment (Coming Soon)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Configure production database URLs
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up monitoring and logging

## 🙏 Acknowledgments

- Google Gemini AI for intelligent question generation
- React community for excellent documentation
- Node.js ecosystem for robust backend tools
- Contributors and testers who helped improve the platform

---

**Made with ❤️ for aspiring developers and interview preparation**
