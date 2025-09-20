const { createWriteStream } = require('fs');
const { join } = require('path');

// Create a setup script for database initialization
const setupScript = `
# Database Setup Instructions

## Prerequisites
Make sure you have the following installed:
- Node.js (v18+)
- PostgreSQL (v12+) - Optional for development
- MongoDB (v4.4+) - Optional for development  
- Redis (v6+) - Optional for development

## Quick Start (Development Mode)

The application is configured to run without databases in development mode.

1. **Install dependencies:**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Start the backend server:**
   \`\`\`bash
   npm run dev
   \`\`\`

The server will start on http://localhost:5000 and will continue even if databases are not available.

## Full Setup (With Databases)

### PostgreSQL Setup

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: \`brew install postgresql\`
   - Ubuntu: \`sudo apt-get install postgresql postgresql-contrib\`

2. **Create database:**
   \`\`\`bash
   sudo -u postgres psql
   CREATE DATABASE ai_interview_platform;
   CREATE USER interview_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_interview_platform TO interview_user;
   \\q
   \`\`\`

3. **Update .env file:**
   \`\`\`
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ai_interview_platform
   DB_USER=interview_user
   DB_PASSWORD=your_password
   \`\`\`

### MongoDB Setup

1. **Install MongoDB:**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: \`brew install mongodb-community\`
   - Ubuntu: Follow https://docs.mongodb.com/manual/installation/

2. **Start MongoDB service:**
   \`\`\`bash
   # macOS/Linux
   sudo systemctl start mongod
   
   # Or using brew on macOS
   brew services start mongodb-community
   \`\`\`

3. **Update .env file:**
   \`\`\`
   MONGODB_URI=mongodb://localhost:27017/interview-content
   \`\`\`

### Redis Setup (Optional - for caching)

1. **Install Redis:**
   - Windows: Download from https://redis.io/download
   - macOS: \`brew install redis\`
   - Ubuntu: \`sudo apt-get install redis-server\`

2. **Start Redis:**
   \`\`\`bash
   redis-server
   \`\`\`

3. **Update .env file:**
   \`\`\`
   REDIS_URL=redis://localhost:6379
   \`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

\`\`\`bash
cp .env.example .env
\`\`\`

Required variables:
- \`NODE_ENV=development\`
- \`PORT=5000\`
- \`JWT_SECRET=your_super_secret_jwt_key\`
- \`GEMINI_API_KEY=your_gemini_api_key\` (for AI features)

## Frontend Setup

1. **Install dependencies:**
   \`\`\`bash
   cd ../frontend
   npm install
   \`\`\`

2. **Start the development server:**
   \`\`\`bash
   npm start
   \`\`\`

The frontend will start on http://localhost:3000

## Google Gemini API Setup

1. **Get API Key:**
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Update .env file:**
   \`\`\`
   GEMINI_API_KEY=your_api_key_here
   \`\`\`

## Testing the Setup

1. **Backend health check:**
   Visit: http://localhost:5000/health

2. **Frontend:**
   Visit: http://localhost:3000

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL/MongoDB services are running
- Check connection credentials in .env
- Verify firewall settings

### Port Conflicts
- Change PORT in backend .env if 5000 is in use
- Change frontend port using: \`PORT=3001 npm start\`

### Permission Issues
- Make sure your user has proper database permissions
- On Linux/macOS, you might need \`sudo\` for service management

## Production Deployment

For production deployment, ensure:
- Set \`NODE_ENV=production\`
- Use strong JWT_SECRET
- Configure production database URLs
- Set up SSL/TLS certificates
- Configure reverse proxy (nginx)
- Set up monitoring and logging
`;

const filePath = join(__dirname, '../../DATABASE_SETUP.md');
const writeStream = createWriteStream(filePath);
writeStream.write(setupScript);
writeStream.end();

console.log('Database setup instructions created at:', filePath);

module.exports = { setupScript };