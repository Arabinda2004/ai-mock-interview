const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/**
 * Interview API Service
 * Handles all interview-related API calls
 */
class InterviewService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication headers with JWT token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Handle API response and errors
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    
    return data;
  }

  /**
   * Generate interview questions based on user setup
   * @param {Object} interviewSetup - User's interview configuration
   * @returns {Promise<Object>} Generated questions and interview data
   */
  async generateQuestions(interviewSetup) {
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token check:', token ? 'Token exists' : 'No token found');
      console.log('📝 Interview setup:', interviewSetup);
      
      const headers = this.getAuthHeaders();
      console.log('📡 Request headers:', headers);
      
      const response = await fetch(`${this.baseURL}/interviews/questions/generate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(interviewSetup)
      });

      console.log('🌐 API Response status:', response.status);
      console.log('🌐 API Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('❌ Error response body:', errorData);
        
        // Check for authentication errors
        if (response.status === 401) {
          throw new Error('Authentication expired. Please clear your session and log back in.');
        }
        
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API Success:', result);
      
      // Store interview data in localStorage for the session
      if (result.success && result.data) {
        localStorage.setItem('currentInterview', JSON.stringify(result.data));
        localStorage.setItem('interviewQuestions', JSON.stringify(result.data.questions));
      }

      return result;
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      throw new Error('Failed to generate interview questions. Please try again.');
    }
  }

  /**
   * Submit an answer for evaluation
   * @param {string} interviewId - Interview session ID
   * @param {Object} answerData - Answer submission data
   * @returns {Promise<Object>} Evaluation results
   */
  async submitAnswer(interviewId, answerData) {
    try {
      const response = await fetch(`${this.baseURL}/interviews/${interviewId}/answer`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(answerData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer. Please try again.');
    }
  }

  /**
   * Generate follow-up question based on previous answer
   * @param {string} interviewId - Interview session ID
   * @param {Object} followupData - Previous question and answer data
   * @returns {Promise<Object>} Follow-up question or null
   */
  async generateFollowUp(interviewId, followupData) {
    try {
      const response = await fetch(`${this.baseURL}/interviews/${interviewId}/followup`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(followupData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error generating follow-up:', error);
      // Return null instead of throwing - follow-ups are optional
      return { success: true, data: { hasFollowUp: false } };
    }
  }

  /**
   * Get interview summary and overall evaluation
   * @param {string} interviewId - Interview session ID
   * @returns {Promise<Object>} Interview summary and evaluation
   */
  async getInterviewSummary(interviewId) {
    try {
      const response = await fetch(`${this.baseURL}/interviews/${interviewId}/summary`, {
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching interview summary:', error);
      throw new Error('Failed to load interview summary. Please try again.');
    }
  }

  /**
   * Get user's interview history with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Results per page (default: 10)
   * @returns {Promise<Object>} Interview history and pagination info
   */
  async getInterviewHistory(page = 1, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseURL}/interviews/history?page=${page}&limit=${limit}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching interview history:', error);
      throw new Error('Failed to load interview history. Please try again.');
    }
  }

  /**
   * Delete an interview record
   * @param {string} interviewId - Interview session ID to delete
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteInterview(interviewId) {
    try {
      const response = await fetch(`${this.baseURL}/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting interview:', error);
      throw new Error('Failed to delete interview. Please try again.');
    }
  }

  /**
   * Get current interview data from localStorage
   * @returns {Object|null} Current interview data
   */
  getCurrentInterview() {
    try {
      const data = localStorage.getItem('currentInterview');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading current interview data:', error);
      return null;
    }
  }

  /**
   * Get current interview questions from localStorage
   * @returns {Array|null} Current interview questions
   */
  getCurrentQuestions() {
    try {
      const data = localStorage.getItem('interviewQuestions');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading interview questions:', error);
      return null;
    }
  }

  /**
   * Clear current interview session data
   */
  clearCurrentInterview() {
    localStorage.removeItem('currentInterview');
    localStorage.removeItem('interviewQuestions');
    localStorage.removeItem('interviewAnswers');
    localStorage.removeItem('interviewProgress');
  }

  /**
   * Save interview progress (answers, timing, etc.)
   * @param {Object} progressData - Progress data to save
   */
  saveProgress(progressData) {
    try {
      localStorage.setItem('interviewProgress', JSON.stringify({
        ...progressData,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving interview progress:', error);
    }
  }

  /**
   * Get saved interview progress
   * @returns {Object|null} Saved progress data
   */
  getSavedProgress() {
    try {
      const data = localStorage.getItem('interviewProgress');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading interview progress:', error);
      return null;
    }
  }

  /**
   * Validate interview setup data before sending
   * @param {Object} interviewSetup - Setup data to validate
   * @returns {Object} Validation result
   */
  validateInterviewSetup(interviewSetup) {
    const errors = [];

    if (!interviewSetup.jobRole) {
      errors.push('Job role is required');
    }

    if (!interviewSetup.skills || !Array.isArray(interviewSetup.skills) || interviewSetup.skills.length === 0) {
      errors.push('At least one skill must be selected');
    }

    if (!interviewSetup.experienceLevel) {
      errors.push('Experience level is required');
    }

    if (!interviewSetup.interviewType) {
      errors.push('Interview type is required');
    }

    if (interviewSetup.duration && (interviewSetup.duration < 5 || interviewSetup.duration > 120)) {
      errors.push('Duration must be between 5 and 120 minutes');
    }

    if (interviewSetup.jobRole === 'Other' && !interviewSetup.customJobRole?.trim()) {
      errors.push('Custom job role is required when "Other" is selected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get interview statistics for dashboard
   * @returns {Promise<Object>} Interview statistics
   */
  async getInterviewStats() {
    try {
      // This would typically be a separate API endpoint
      // For now, we'll derive stats from interview history
      const historyResponse = await this.getInterviewHistory(1, 100);
      
      if (!historyResponse.success) {
        return { success: false, data: {} };
      }

      const interviews = historyResponse.data.interviews || [];
      const totalInterviews = interviews.length;
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      const averageScore = completedInterviews.length > 0 
        ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length 
        : 0;

      const stats = {
        totalInterviews,
        completedInterviews: completedInterviews.length,
        averageScore: Math.round(averageScore * 10) / 10,
        improvementTrend: this.calculateImprovementTrend(completedInterviews),
        recentActivity: interviews.slice(0, 5)
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching interview stats:', error);
      return { 
        success: false, 
        data: {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          improvementTrend: 'stable',
          recentActivity: []
        }
      };
    }
  }

  /**
   * Calculate improvement trend from interview history
   * @param {Array} completedInterviews - Array of completed interviews
   * @returns {string} Trend indicator: 'improving', 'declining', or 'stable'
   */
  calculateImprovementTrend(completedInterviews) {
    if (completedInterviews.length < 2) return 'stable';

    const recent = completedInterviews.slice(-3);
    const earlier = completedInterviews.slice(-6, -3);

    if (recent.length === 0 || earlier.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, i) => sum + (i.score || 0), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, i) => sum + (i.score || 0), 0) / earlier.length;

    if (recentAvg > earlierAvg + 0.3) return 'improving';
    if (recentAvg < earlierAvg - 0.3) return 'declining';
    return 'stable';
  }
}

export default new InterviewService();