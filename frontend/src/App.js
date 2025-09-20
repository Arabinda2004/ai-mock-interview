import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';

// Import pages (to be created)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import Results from './pages/Results';
import History from './pages/History';
import Profile from './pages/Profile';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InterviewSession from './components/InterviewSession';
import AuthDebug from './components/AuthDebug';

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/debug" element={<AuthDebug />} />
            
            <Route path="/interview-setup" element={
              <ProtectedRoute>
                <Layout>
                  <InterviewSetup />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/interview-session" element={
              <ProtectedRoute>
                <InterviewSession />
              </ProtectedRoute>
            } />
            
            <Route path="/interview-results" element={
              <ProtectedRoute>
                <Layout>
                  <Results />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/interview/setup" element={
              <ProtectedRoute>
                <Layout>
                  <InterviewSetup />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/interview/live/:id" element={
              <ProtectedRoute>
                <Layout>
                  <LiveInterview />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/interview/results/:id" element={
              <ProtectedRoute>
                <Layout>
                  <Results />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout>
                  <History />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to dashboard if authenticated, otherwise to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;