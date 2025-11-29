import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Download,
  Share2,
  Home,
  BarChart3,
  Calendar
} from 'lucide-react';
import interviewService from '../services/interviewService';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = () => {
    try {
      // Get results from location state or localStorage
      const resultData = location.state?.results || interviewService.getLastResults();
      
      if (!resultData) {
        navigate('/dashboard');
        return;
      }

      setResults(resultData);
      
      // Save to history
      saveToHistory(resultData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoading(false);
    }
  };

  const saveToHistory = (resultData) => {
    try {
      const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
      const newEntry = {
        id: `interview_${Date.now()}`,
        date: new Date().toISOString(),
        ...resultData
      };
      history.unshift(newEntry);
      // Keep last 50 interviews
      localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 50)));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-results-${Date.now()}.json`;
    link.click();
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Interview Results',
        text: `I scored ${results.overallScore}% in my AI mock interview!`,
      }).catch(err => console.log('Error sharing:', err));
    }
  };

  if (loading || !results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const totalQuestions = results.totalQuestions || 0;
  const answeredQuestions = results.answeredQuestions || 0;
  const overallScore = results.overallScore || 0;
  const timeTaken = results.timeTaken || '0 min';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
          <p className="text-gray-600 mt-1">Your performance summary and detailed feedback</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadResults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button
            onClick={shareResults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className={`card border-2 ${getScoreBg(overallScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white rounded-full">
              <Trophy className={`h-12 w-12 ${getScoreColor(overallScore)}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
              <p className={`text-4xl font-bold mt-2 ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </p>
              <p className="text-lg text-gray-600 mt-1">
                {getPerformanceLevel(overallScore)}
              </p>
            </div>
          </div>
          <div className="text-right space-y-3">
            <div className="flex items-center space-x-2 text-gray-700">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-lg">
                {answeredQuestions} of {totalQuestions} Questions Answered
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-lg">Time Taken: {timeTaken}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Response Time */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Avg Response Time</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {results.avgResponseTime || '2m 30s'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Per question</p>
        </div>

        {/* Accuracy Rate */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Accuracy Rate</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {results.accuracyRate || '85'}%
          </p>
          <p className="text-sm text-gray-600 mt-2">Correct responses</p>
        </div>

        {/* Confidence Level */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Confidence</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {results.confidenceLevel || 'High'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Based on answer quality</p>
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {(results.strengths || [
              'Clear and concise communication',
              'Good technical knowledge',
              'Structured problem-solving approach'
            ]).map((strength, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-3">
            {(results.improvements || [
              'Provide more detailed examples',
              'Consider edge cases in solutions',
              'Improve time complexity analysis'
            ]).map((improvement, index) => (
              <li key={index} className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Detailed Question Analysis</h3>
          </div>
          <button
            onClick={() => setShowAllQuestions(!showAllQuestions)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllQuestions ? 'Show Less' : 'Show All Questions'}
          </button>
        </div>

        <div className="space-y-4">
          {(results.questionResults || []).slice(0, showAllQuestions ? undefined : 3).map((qResult, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      Question {index + 1}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      qResult.score >= 80 ? 'bg-green-100 text-green-700' :
                      qResult.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Score: {qResult.score}%
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{qResult.question}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                <p className="text-gray-900">{qResult.userAnswer}</p>
              </div>

              {qResult.feedback && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-600 font-medium mb-1">AI Feedback:</p>
                  <p className="text-gray-700 text-sm">{qResult.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>View History</span>
          </button>
          <button
            onClick={() => navigate('/interview-setup')}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Start New Interview</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;