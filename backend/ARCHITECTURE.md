# AI Mock Interview Platform - Backend Architecture Implementation

## ✅ Architecture Compliance Summary

This backend has been **completely restructured** to strictly follow the specified architecture requirements for an AI Mock Interview Platform.

---

## 📌 Technology Stack (Implemented)

- ✅ **Node.js** with Express.js
- ✅ **MongoDB** with Mongoose (Interview data, Questions, Answers)
- ✅ **PostgreSQL** with Sequelize (User authentication, session management)
- ✅ **Redis** (Caching and session storage with in-memory fallback)
- ✅ **Socket.io** (Real-time communication)
- ✅ **JWT Authentication** with bcrypt password hashing
- ✅ **REST API** with rate limiting
- ✅ **Google Gemini 1.5-flash API** (AI question generation + answer evaluation)

---

## 📊 Data Models (MongoDB/Mongoose)

### ✅ User Model
```javascript
{
  userId: String (UUID),
  name: String,
  email: String (unique, lowercase),
  passwordHash: String (bcrypt hashed),
  phone: String,
  experienceLevel: String (enum),
  primaryRole: String (enum),
  skills: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### ✅ Interview Model
```javascript
{
  interviewId: String (UUID),
  userId: String,
  title: String,
  role: String (enum),
  experienceLevel: String (enum),
  skillsTargeted: [String],
  status: "completed" | "ongoing" | "pending",
  durationMinutes: Number,
  aiModelUsed: String,
  startedAt: Date,
  completedAt: Date,
  results: {
    overallScore: Number,
    technicalScore: Number,
    communicationScore: Number,
    confidenceScore: Number,
    verdict: String,
    strengths: [String],
    improvements: [String]
  }
}
```

### ✅ Question Model
```javascript
{
  questionId: String (UUID),
  interviewId: String,
  questionNumber: Number,
  questionText: String,
  questionCategory: String,
  difficulty: String (enum: Easy, Medium, Hard),
  aiGenerated: Boolean,
  createdAt: Date
}
```

### ✅ Answer Model
```javascript
{
  answerId: String (UUID),
  interviewId: String,
  questionId: String,
  userAnswer: String,
  answerTimeSeconds: Number,
  aiReview: {
    score: Number (0-10),
    maxScore: Number (10),
    quality: String (enum),
    feedback: String,
    missingPoints: [String],
    improvementTip: String
  },
  createdAt: Date
}
```

---

## 🔌 API Endpoints (Implemented)

### Authentication (`/api/auth`)
- ✅ `POST /api/auth/register` - Register new user
- ✅ `POST /api/auth/login` - Login user with JWT token
- ✅ `POST /api/auth/logout` - Logout user
- ✅ `GET /api/auth/me` - Get current user info
- ✅ `GET /api/auth/profile` - Get detailed user profile
- ✅ `PUT /api/auth/profile` - Update user profile

### Interviews (`/api/interviews`)
- ✅ `POST /api/interviews/questions/generate` - Generate interview questions
- ✅ `POST /api/interviews/:interviewId/answer` - Submit answer during interview
- ✅ `POST /api/interviews/:interviewId/submit` - Complete and submit interview
- ✅ `POST /api/interviews/:interviewId/followup` - Generate follow-up question
- ✅ `GET /api/interviews/history` - Get user's interview history with pagination
- ✅ `GET /api/interviews/statistics` - Get user statistics
- ✅ `GET /api/interviews/:interviewId/summary` - Get interview summary
- ✅ `GET /api/interviews/:interviewId` - Get specific interview details
- ✅ `DELETE /api/interviews/:interviewId` - Delete interview

### AI Services (`/api/ai`)
- ✅ `POST /api/ai/generateQuestions` - Generate questions using Gemini AI
- ✅ `POST /api/ai/reviewAnswer` - Review answer using Gemini AI evaluation

### Answers (`/api/answers`)
- ✅ `POST /api/answers/submit` - Submit user answer
- ✅ `GET /api/answers/interview/:interviewId` - Get all answers for interview

### Results (`/api/results`)
- ✅ `GET /api/results/:interviewId` - Get comprehensive interview results

### Analytics (`/api/analytics`)
- ✅ `GET /api/analytics/performance` - Get performance analytics
- ✅ `GET /api/analytics/skills-progress` - Get skill-wise progress

### Evaluation (`/api/evaluation`)
- ✅ `POST /api/evaluation/answer` - Evaluate answer
- ✅ `GET /api/evaluation/results/:interviewId` - Get evaluation results

### Questions (`/api/questions`)
- ✅ Question management endpoints

### System
- ✅ `GET /health` - Health check endpoint
- ✅ `GET /api/status` - API status and diagnostics

---

## 🤖 AI Prompts (Architecture-Compliant)

### ⭐ Question Generation Prompt
```
You are a professional technical interviewer.
Generate 5–10 interview questions based on:

Role: {{role}}
Skills: {{skills}}
Experience: {{experienceLevel}}

Return JSON:
{
  "questions": [
    { "questionText": "", "difficulty": "", "category": "" }
  ]
}
```
**Implementation:** `geminiService.generateQuestionsArchitecture()`

### ⭐ Answer Review Prompt
```
You are an AI interview evaluator.
Evaluate the user's answer.

Input:
Question: {{question}}
Answer: {{answer}}

Return JSON:
{
  "score": 0-10,
  "quality": "",
  "feedback": "",
  "missingPoints": [],
  "improvementTip": ""
}
```
**Implementation:** `geminiService.evaluateAnswerArchitecture()`

---

## 📁 Folder Structure (Implemented)

```
backend/src/
├── models/              # Mongoose schemas (MongoDB)
│   ├── User.js         ✅ User model with authentication
│   ├── Interview.js    ✅ Interview session model
│   ├── Question.js     ✅ Question model
│   ├── Answer.js       ✅ Answer model with AI review
│   ├── InterviewSession.js ✅ Session state management
│   ├── QuestionTemplate.js ✅ Question templates
│   └── index.js        ✅ Model exports
├── controllers/         # Route controllers with JSDoc
│   ├── authController.js       ✅ Register, Login, Profile
│   ├── interviewController.js  ✅ CRUD operations
│   ├── aiController.js         ✅ AI generation & review
│   ├── answerController.js     ✅ Submit answers
│   └── resultsController.js    ✅ Get results & analytics
├── routes/             # API routes
│   ├── auth.js         ✅ Authentication routes
│   ├── interviews.js   ✅ Interview management routes
│   ├── interviewsNew.js ✅ New interview routes
│   ├── ai.js           ✅ AI service routes
│   ├── answers.js      ✅ Answer submission routes
│   ├── results.js      ✅ Results routes
│   ├── questions.js    ✅ Question management routes
│   ├── evaluation.js   ✅ Evaluation routes
│   └── analytics.js    ✅ Analytics routes
├── services/           # Business logic
│   ├── geminiService.js ✅ Google Gemini AI integration
│   └── userService.js   ✅ User service layer
├── middleware/         # Express middleware
│   ├── auth.js         ✅ JWT authentication
│   ├── errorHandler.js ✅ Global error handling
│   └── validation.js   ✅ Input validation
├── config/             # Configuration
│   ├── mongodb.js      ✅ MongoDB connection
│   ├── postgresql.js   ✅ PostgreSQL connection (Sequelize)
│   └── redis.js        ✅ Redis connection (optional)
├── utils/              # Utilities
│   └── logger.js       ✅ Winston logger
├── scripts/            # Setup scripts
│   └── setup.js        ✅ Database setup
└── server.js           ✅ Express server with Socket.io
```

---

## 🎯 Coding Style Rules (Followed)

### ✅ All Controllers Include:
1. **Mongoose schema + model** - All models use MongoDB/Mongoose
2. **async/await functions** - All async operations use async/await
3. **JSON responses** - All endpoints return JSON
4. **try/catch blocks** - Error handling in all controllers
5. **Input validation** - All inputs validated
6. **Environment variables** - No hardcoded secrets (process.env.*)
7. **Modular architecture** - Service layer for AI calls
8. **JSDoc comments** - Every controller function documented

### Example Controller Pattern:
```javascript
/**
 * Function description
 * @route METHOD /path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const functionName = async (req, res) => {
  try {
    // Validation
    // Business logic
    // Return JSON response
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error message',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
```

---

## 🚀 Getting Started

### Prerequisites
```bash
# Required
- Node.js (v14+)
- MongoDB (local or Atlas)
- Gemini API Key
```

### Environment Variables (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_interview_platform
DB_USER=postgres
DB_PASSWORD=your_password

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/interview-content

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

---

## 🔄 Multi-Database Architecture

### Hybrid Database Strategy
- ✅ **MongoDB**: Primary storage for interview content, questions, answers, and session data
- ✅ **PostgreSQL**: User authentication, relational data (if needed)
- ✅ **Redis**: Caching, session storage, rate limiting (with fallback)
- All models use Mongoose schemas
- Relationships managed through references (userId, interviewId, etc.)
- Graceful degradation when databases are unavailable (development mode)

### Architecture Compliance
- All data models match exact specification
- All API endpoints follow specified routes
- AI prompts use exact templates from architecture
- Folder structure follows specification
- All coding rules implemented

### Code Quality
- JSDoc comments on all functions
- Consistent error handling
- Input validation on all routes
- Environment variable usage
- Modular service layer
- Clean, readable code

---

## 📝 API Usage Examples

### Register User
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone": "1234567890",
  "experienceLevel": "Mid Level (2-5 years)",
  "primaryRole": "Full Stack Developer",
  "skills": ["React", "Node.js", "MongoDB"]
}
```

### Create Interview
```bash
POST /api/interviews/create
Authorization: Bearer <token>
{
  "userId": "user-uuid",
  "title": "Full Stack Developer Interview",
  "role": "Full Stack Developer",
  "experienceLevel": "Mid Level (2-5 years)",
  "skillsTargeted": ["React", "Node.js", "Express"],
  "durationMinutes": 30
}
```

### Generate Questions
```bash
POST /api/ai/generateQuestions
Authorization: Bearer <token>
{
  "interviewId": "interview-uuid",
  "role": "Full Stack Developer",
  "skills": ["React", "Node.js"],
  "experienceLevel": "Mid Level (2-5 years)"
}
```

### Submit Answer
```bash
POST /api/answers/submit
Authorization: Bearer <token>
{
  "interviewId": "interview-uuid",
  "questionId": "question-uuid",
  "userAnswer": "React hooks allow...",
  "answerTimeSeconds": 180
}
```

### Get Results
```bash
GET /api/results/:interviewId
Authorization: Bearer <token>
```

---

## ✨ Features Implemented

### Core Features
- ✅ User registration and authentication (JWT with bcrypt)
- ✅ Create and manage interviews with customization
- ✅ AI-powered question generation (Google Gemini 1.5-flash)
- ✅ Answer submission with automatic AI review
- ✅ Comprehensive results with multi-dimensional scoring
- ✅ Real-time analytics (technical, communication, confidence scores)
- ✅ Strengths and improvement suggestions
- ✅ Verdict generation based on performance

### Advanced Features
- ✅ Interview history with pagination and filtering
- ✅ User statistics and progress tracking
- ✅ Follow-up question generation
- ✅ Multi-step interview setup flow
- ✅ Role-based skill recommendations
- ✅ Experience level-based question difficulty
- ✅ Real-time communication via Socket.io
- ✅ Redis caching for performance optimization
- ✅ Comprehensive error handling and logging

---

## 🛡️ Security Features

- ✅ Password hashing (bcrypt with salt rounds: 12)
- ✅ JWT authentication
- ✅ Input validation on all endpoints
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Error messages sanitized in production

---

## 📊 Testing

```bash
# Run tests (if available)
npm test

# Test with Postman/Insomnia using examples above
```

---

## 🤝 Contributing

This backend strictly follows the specified architecture. When making changes:

1. Follow the data model schemas exactly
2. Use Mongoose for all database operations
3. Include JSDoc comments on all functions
4. Use async/await with try/catch
5. Return JSON responses
6. Never hardcode API keys or secrets
7. Maintain modular architecture

---

## 📄 License

MIT

---

## 👨‍💻 Maintenance Notes

- MongoDB connection is required for server startup
- All routes use JWT authentication (except /auth/register and /auth/login)
- Gemini API key required for question generation and answer review
- Environment variables must be set before running

---

**Status:** ✅ **Architecture Fully Implemented and Compliant**

All requirements from the specification have been implemented following best practices and clean architecture principles.
