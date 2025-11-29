import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  BarChart3,
  Award
} from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    highestScore: 0,
    totalTime: 0
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, searchTerm, filterType, sortBy]);

  const loadHistory = () => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
      setHistory(savedHistory);
      calculateStats(savedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const calculateStats = (historyData) => {
    if (historyData.length === 0) {
      setStats({ totalInterviews: 0, avgScore: 0, highestScore: 0, totalTime: 0 });
      return;
    }

    const totalInterviews = historyData.length;
    const scores = historyData.map(h => h.overallScore || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalInterviews);
    const highestScore = Math.max(...scores);
    
    setStats({
      totalInterviews,
      avgScore,
      highestScore,
      totalTime: totalInterviews * 30 // Approximate
    });
  };

  const filterAndSortHistory = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.jobRole?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.interviewType?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.interviewType === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'score':
          return (b.overallScore || 0) - (a.overallScore || 0);
        case 'questions':
          return (b.totalQuestions || 0) - (a.totalQuestions || 0);
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  };

  const deleteInterview = (id) => {
    if (window.confirm('Are you sure you want to delete this interview record?')) {
      const updated = history.filter(item => item.id !== id);
      localStorage.setItem('interviewHistory', JSON.stringify(updated));
      setHistory(updated);
      calculateStats(updated);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all interview history? This action cannot be undone.')) {
      localStorage.removeItem('interviewHistory');
      setHistory([]);
      setFilteredHistory([]);
      calculateStats([]);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-history-${Date.now()}.json`;
    link.click();
  };

  const viewDetails = (interview) => {
    navigate('/results', { state: { results: interview } });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <p className="text-gray-600 mt-1">Track your progress and review past interviews</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportHistory}
            disabled={history.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={clearAllHistory}
            disabled={history.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Interviews</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.avgScore}%</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Highest Score</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.highestScore}%</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Time</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.totalTime}m</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job role or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="questions">Sort by Questions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interview History List */}
      {filteredHistory.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {history.length === 0 ? 'No Interview History Yet' : 'No Matches Found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {history.length === 0
              ? 'Start your first interview to see your progress here'
              : 'Try adjusting your search or filters'}
          </p>
          {history.length === 0 && (
            <button
              onClick={() => navigate('/interview-setup')}
              className="btn-primary px-6 py-3"
            >
              Start First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((interview) => (
            <div
              key={interview.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => viewDetails(interview)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className={`px-4 py-2 rounded-full ${getScoreBg(interview.overallScore || 0)}`}>
                      <span className={`text-2xl font-bold ${getScoreColor(interview.overallScore || 0)}`}>
                        {interview.overallScore || 0}%
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {interview.jobRole || 'Interview'}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(interview.date)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {interview.interviewType || 'Mixed'}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {interview.timeTaken || '30 min'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      {interview.answeredQuestions || 0}/{interview.totalQuestions || 0} Questions
                    </span>
                    <span className="flex items-center">
                      Difficulty: <span className="ml-1 font-medium capitalize">{interview.difficulty || 'Medium'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewDetails(interview);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInterview(interview.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;