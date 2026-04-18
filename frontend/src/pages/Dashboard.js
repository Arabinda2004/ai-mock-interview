import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BarChart3, Clock, TrendingUp, Award, Target } from 'lucide-react';
import interviewService from '../services/interviewService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    highestScore: 0,
    totalTime: 0,
    thisWeek: 0
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics from backend API
      const statsResponse = await interviewService.getInterviewStatistics();
      
      if (statsResponse.success) {
        setStats({
          totalInterviews: statsResponse.data.totalInterviews,
          avgScore: statsResponse.data.avgScore,
          highestScore: statsResponse.data.highestScore,
          totalTime: statsResponse.data.totalTime,
          thisWeek: statsResponse.data.thisWeek
        });
      }
      
      // Fetch recent interviews for quick view
      const historyResponse = await interviewService.getInterviewHistory(1, 3);
      
      if (historyResponse.success) {
        setRecentInterviews(historyResponse.data.interviews);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to localStorage if API fails
      loadDashboardDataFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardDataFromLocalStorage = () => {
    try {
      const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
      
      // Calculate statistics
      const totalInterviews = history.length;
      const scores = history.map(h => h.overallScore || 0);
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      // Calculate this week's interviews
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = history.filter(h => new Date(h.date) > oneWeekAgo).length;
      
      // Calculate total practice time (approximate)
      const totalTime = Math.round(totalInterviews * 0.5); // Assuming avg 30 min per interview
      
      setStats({
        totalInterviews,
        avgScore,
        highestScore,
        totalTime,
        thisWeek
      });
      
      setRecentInterviews(history.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data from localStorage:', error);
    }
  };

  const getFullName = () => {
    if (user?.name) {
      return `${user.name}`;
    }
    return user?.email || 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {getFullName()}!
        </h1>
        <p className="text-blue-100">
          Ready to practice your interview skills? Let's get started with your next session.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgScore}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Highest Score</p>
              <p className="text-2xl font-bold text-purple-600">{stats.highestScore}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/interview-setup')}
            className="btn-primary text-left p-4 h-auto"
          >
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" />
              <div>
                <p className="font-medium">Start New Interview</p>
                <p className="text-sm opacity-75">Begin a practice session</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/history')}
            className="btn-secondary text-left p-4 h-auto"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="font-medium">Interview History</p>
                <p className="text-sm opacity-75">Browse all sessions</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="btn-secondary text-left p-4 h-auto"
          >
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" />
              <div>
                <p className="font-medium">View Profile</p>
                <p className="text-sm opacity-75">Manage your account</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Interviews */}
      {recentInterviews.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Interviews</h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentInterviews.map((interview, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => navigate('/results', { state: { results: interview } })}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className={`text-xl font-bold ${getScoreColor(interview.overallScore || 0)}`}>
                      {interview.overallScore || 0}%
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{interview.jobRole || 'Interview'}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{formatDate(interview.date)}</span>
                      <span>•</span>
                      <span className="capitalize">{interview.interviewType || 'Mixed'}</span>
                      <span>•</span>
                      <span>{interview.totalQuestions || 0} Questions</span>
                    </div>
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{getFullName()}</p>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <p className="text-xs text-gray-500">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;