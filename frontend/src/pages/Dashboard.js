import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BarChart3, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Practice Time</p>
              <p className="text-2xl font-bold text-gray-900">0h</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/interview/setup')}
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
            onClick={() => navigate('/results')}
            className="btn-secondary text-left p-4 h-auto"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5" />
              <div>
                <p className="font-medium">View Results</p>
                <p className="text-sm opacity-75">Check past performance</p>
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
        </div>
      </div>

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