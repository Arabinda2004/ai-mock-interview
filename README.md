# 🚀 AI Interview Platform

A comprehensive AI-powered interview practice platform built with React, Node.js, and Google Gemini API.

## ✨ Current Features (Completed)

- ✅ **Multi-step Interview Setup**: Customizable job roles, skills, experience levels
- ✅ **AI Question Generation**: Intelligent questions powered by Google Gemini 1.5-flash API
- ✅ **JWT Authentication**: Secure user registration and login system
- ✅ **Responsive Design**: Professional UI with TailwindCSS
- ✅ **Multiple Interview Types**: Technical, Behavioral, and Mixed interviews
- ✅ **Dynamic Skill Selection**: Role-based skill suggestions with custom additions
- ✅ **Error Handling**: Comprehensive debugging and user-friendly error messages

## 🛠️ Tech Stack

- **Frontend**: React 18 with TailwindCSS
- **Backend**: Node.js with Express.js  
- **Database**: PostgreSQL + MongoDB + Redis (with in-memory fallback)
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: Google Gemini 1.5-flash API
- **HTTP Client**: Native Fetch API
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks
- **Icons**: Lucide React
- **Logging**: Winston Logger
- **Multi-Modal Input**: Support for both text and voice responses
- **Professional UI/UX**: Modern, responsive design with smooth user experience
- **Secure Authentication**: JWT-based authentication with password encryption
- **Historical Tracking**: Complete interview session storage and replay capability

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
- **Google Gemini API** for AI question generation and evaluation
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
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- Google Gemini API key

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

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Start the frontend development server
   npm start
   ```

4. **Database Setup**
   - Create PostgreSQL database: `ai_interview_platform`
   - Create MongoDB database: `interview-content`
   - Run backend server to auto-create tables/collections

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_interview_platform
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# MongoDB
MONGODB_URI=mongodb://localhost:27017/interview-content

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Interview Management
- `POST /api/interviews/create` - Create new interview session
- `GET /api/interviews/history` - Get user's interview history
- `GET /api/interviews/:id` - Get specific interview details
- `PUT /api/interviews/:id/complete` - Mark interview as complete

### Question Generation
- `POST /api/questions/generate` - Generate AI questions for interview
- `GET /api/questions/interview/:id` - Get questions for specific interview

### Evaluation System
- `POST /api/evaluate/answer` - Evaluate user's answer
- `GET /api/evaluate/results/:interviewId` - Get interview results

### Analytics
- `GET /api/analytics/performance` - Get performance analytics
- `GET /api/analytics/skills-progress` - Get skill-wise progress

## 🎯 Core Features Implementation

### 1. Interview Setup
- Dynamic job role selection with skill filtering
- Experience level-based question difficulty
- Customizable interview duration and question count

### 2. AI Question Generation
- Integration with Google Gemini API
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
- Comparative analysis with optimal answers

### 5. Performance Analytics
- Historical performance tracking
- Skill-wise improvement charts
- Difficulty progression analysis
- Export functionality

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Environment variable protection

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
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd ../backend
NODE_ENV=production npm start
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

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

For support, email your-email@example.com or create an issue in the repository.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent question generation
- React community for excellent documentation
- Node.js ecosystem for robust backend tools
- Contributors and testers who helped improve the platform

---

**Made with ❤️ for aspiring developers and interview preparation**