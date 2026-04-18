import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import interviewService from '../services/interviewService';

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Interview session state
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Timer state
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);
  
  // Progress tracking
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  
  // Refs for timers and speech
  const sessionTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  // Initialize interview session
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have interview data from localStorage or navigation state
        let interviewData = interviewService.getCurrentInterview();
        
        if (!interviewData && location.state?.interview) {
          interviewData = location.state.interview;
          // Save to localStorage for page refresh
          localStorage.setItem('currentInterview', JSON.stringify(interviewData));
        }
        
        if (!interviewData) {
          // No interview data, redirect to setup
          console.error('❌ No interview data found');
          navigate('/interview-setup');
          return;
        }

        console.log('📋 Interview data loaded:', interviewData);
        setInterview(interviewData);
        
        // Get questions - they might be in different places depending on the response
        let questionsData = null;
        
        // Try different locations for questions
        if (interviewData.questions) {
          questionsData = interviewData.questions;
          console.log('✅ Found questions in interviewData.questions');
        } else if (location.state?.interview?.questions) {
          questionsData = location.state.interview.questions;
          console.log('✅ Found questions in location.state.interview.questions');
        } else {
          questionsData = interviewService.getCurrentQuestions();
          console.log('✅ Found questions from interviewService');
        }
        
        console.log('📝 Questions data:', questionsData);
        console.log('📊 Number of questions:', questionsData?.length || 0);
        
        if (!questionsData || questionsData.length === 0) {
          console.error('❌ No questions found in interview data');
          console.error('📋 Interview data structure:', JSON.stringify(interviewData, null, 2));
          throw new Error('No questions available for this interview. The question generation may have failed. Please try setting up the interview again.');
        }

        console.log('✅ Loaded', questionsData.length, 'questions');

        // Normalize questions - ensure they have all required fields
        const normalizedQuestions = questionsData.map((q, index) => {
          // Support both 'question' and 'questionText' fields
          const questionText = q.question || q.questionText || 'Question text not available';
          return {
            ...q,
            id: q.id || q.questionId || `q_${index + 1}`,
            question: questionText,
            questionText: questionText,
            category: q.category || q.questionCategory || 'General',
            difficulty: q.difficulty || 'Medium',
            type: q.type || 'general',
            hints: q.hints || ['Take your time', 'Think through your answer'],
            evaluationCriteria: q.evaluationCriteria || ['Knowledge', 'Communication']
          };
        });

        console.log('✅ Normalized questions:', normalizedQuestions);
        setQuestions(normalizedQuestions);
        
        // Load saved progress if any
        const savedProgress = interviewService.getSavedProgress();
        let startTime = Date.now();

        if (savedProgress) {
          setAnswers(savedProgress.answers || {});
          setEvaluations(savedProgress.evaluations || {});
          setCurrentQuestionIndex(savedProgress.currentQuestionIndex || 0);
          if (savedProgress.sessionStartTime) {
            startTime = savedProgress.sessionStartTime;
          }
        } else {
          // Save initial progress
          interviewService.saveProgress({
            answers: {},
            currentQuestionIndex: 0,
            sessionStartTime: startTime
          });
        }

        // Start session
        setSessionStartTime(startTime);
        sessionStartTimeRef.current = startTime;
        setQuestionStartTime(Date.now());
        questionStartTimeRef.current = Date.now();
        
        // Start timers
        startSessionTimer();
        startQuestionTimer();
        
        // Read first question aloud
        readQuestionAloud(questionsData[0]);

      } catch (error) {
        console.error('Error initializing interview:', error);
        setError('Failed to load interview session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeInterview();
    
    // Cleanup on unmount
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      if (speechSynthesisRef.current) speechSynthesis.cancel();
    };
  }, [navigate, location.state]);

  // Timer functions
  const startSessionTimer = () => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    
    sessionTimerRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        setSessionElapsed(Date.now() - sessionStartTimeRef.current);
      }
    }, 1000);
  };

  const startQuestionTimer = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    const now = Date.now();
    setQuestionStartTime(now);
    questionStartTimeRef.current = now;
    
    questionTimerRef.current = setInterval(() => {
      setQuestionElapsed(Date.now() - now);
    }, 1000);
  };

  const stopQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  };

  // Speech functions
  const readQuestionAloud = (question) => {
    if (!question || isSpeaking) return;
    
    try {
      speechSynthesis.cancel();
      const questionText = question.question || question.questionText || '';
      if (!questionText) {
        console.warn('No question text to read aloud');
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    } catch (error) {
      console.error('Error reading question aloud:', error);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (questions[currentQuestionIndex]) {
      readQuestionAloud(questions[currentQuestionIndex]);
    }
  };

  // Voice recording (placeholder - would need Web Speech API implementation)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
  };

  // Answer submission
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer before continuing.');
      return;
    }

    // Validate questions are loaded
    if (!questions || questions.length === 0) {
      setError('Questions not loaded. Please refresh and try again.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      setError('Invalid question. Please refresh and try again.');
      console.error('Current question not found:', { currentQuestionIndex, questionsLength: questions.length });
      return;
    }

    try {
      setIsSubmitting(true);
      stopQuestionTimer();

      const answerData = {
        questionId: currentQuestion.id || currentQuestion.questionId || `q_${currentQuestionIndex}`,
        questionText: currentQuestion.question || currentQuestion.questionText,
        answer: currentAnswer.trim(),
        timeSpent: Math.floor(questionElapsed / 1000)
      };

      // Store answer locally (don't evaluate yet)
      const newAnswers = {
        ...answers,
        [currentQuestionIndex]: {
          ...answerData,
          submittedAt: new Date().toISOString()
        }
      };

      setAnswers(newAnswers);

      // Save progress
      interviewService.saveProgress({
        answers: newAnswers,
        currentQuestionIndex: currentQuestionIndex + 1,
        sessionStartTime: sessionStartTimeRef.current
      });

      // Move to next question or complete interview
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        // All questions answered, submit for evaluation
        completeInterview(newAnswers);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to save answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setShowHints(false);
      setError('');
      
      startQuestionTimer();
      
      // Read next question
      setTimeout(() => {
        readQuestionAloud(questions[currentQuestionIndex + 1]);
      }, 500);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1]?.answer || '');
      setError('');
      
      startQuestionTimer();
    }
  };

  const completeInterview = async (finalAnswers = null) => {
    try {
      // Stop all timers
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      
      const answersToSubmit = finalAnswers || answers;
      
      // Show loading state
      setIsSubmitting(true);
      
      // Prepare answers array for submission
      const answersArray = questions.map((q, idx) => ({
        questionId: q.id || q.questionId,
        questionText: q.question || q.questionText,
        answer: answersToSubmit[idx]?.answer || '',
        timeSpent: answersToSubmit[idx]?.timeSpent || 0
      }));
      
      // Ensure we have interview setup data
      const interviewSetup = interview.setup || {
        jobRole: interview.jobRole || interview.role || 'Interview',
        skills: interview.skills || interview.skillsTargeted || [],
        experienceLevel: interview.experienceLevel || 'mid-level',
        interviewType: interview.interviewType || 'mixed',
        difficulty: interview.difficulty || 'medium'
      };
      
      console.log('🔧 Interview setup:', interviewSetup);
      
      // Submit all answers for evaluation
      console.log('📤 Submitting interview:', {
        interviewId: interview.interviewId,
        questionsCount: questions.length,
        answersCount: answersArray.filter(a => a.answer).length
      });
      
      const evaluationResponse = await interviewService.submitAllAnswers(
        interview.interviewId,
        questions,
        answersArray,
        interviewSetup
      );
      
      console.log('✅ Evaluation response:', evaluationResponse);
      
      if (!evaluationResponse.success) {
        throw new Error(evaluationResponse.message || 'Failed to evaluate interview');
      }
      
      // Backend now returns complete results with questions and evaluations
      const results = evaluationResponse.data;
      
      if (!results || !results.interviewId) {
        console.error('❌ Invalid results structure:', results);
        throw new Error('Invalid response from server');
      }
      
      // Enhance with timing data
      results.timeTaken = formatTime(sessionElapsed);
      results.avgResponseTime = results.answeredQuestions > 0 
        ? formatTime(sessionElapsed / results.answeredQuestions)
        : '0:00';
      
      console.log('📊 Complete results:', results);
      
      // Save results to localStorage for Results page
      interviewService.saveResults(results);
      
      // Clear current interview session
      interviewService.clearCurrentSession();
      
      // Navigate to results with complete data
      navigate('/results', { state: { results }, replace: true });
      
    } catch (error) {
      console.error('❌ Error completing interview:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        interviewId: interview?.interviewId,
        answersSubmitted: Object.keys(answers).length,
        apiUrl: interviewService.baseURL
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to complete interview.';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error: Could not connect to server. Please check if the backend is running.';
      } else if (error.message.includes('401') || error.message.includes('Authentication')) {
        errorMessage = 'Authentication expired. Please refresh the page and log in again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please try again or contact support.';
      } else if (error.message) {
        errorMessage = `Failed to complete interview: ${error.message}`;
      }
      
      setError(`${errorMessage} Your answers have been saved locally.`);
      setIsSubmitting(false);
    }
  };

  // Utility functions
  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentQuestion = () => questions[currentQuestionIndex];
  const getProgress = () => ((currentQuestionIndex) / questions.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Interview Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/interview-setup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">
                {interview?.setup?.jobRole} Interview
              </h1>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span className="font-mono">{formatTime(sessionElapsed)}</span>
              </div>
              
              <button
                onClick={completeInterview}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                End Interview
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="pb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {currentQuestion?.category}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {currentQuestion?.difficulty}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-800 mb-4">
                    {currentQuestion?.question}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={toggleSpeech}
                    className={`p-2 rounded-lg transition-colors ${ 
                      isSpeaking 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                  >
                    {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Question Timer */}
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Time on this question: {formatTime(questionElapsed)}
                </span>
                <span className="text-sm text-gray-400">
                  (Expected: {currentQuestion?.expectedDuration})
                </span>
              </div>

              {/* Hints */}
              {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{showHints ? 'Hide' : 'Show'} Hints</span>
                  </button>
                  
                  {showHints && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                      <ul className="space-y-2">
                        {currentQuestion.hints.map((hint, index) => (
                          <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Answer
                  </label>
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                </div>
                
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... (or use voice recording)"
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
                
                {error && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-4">
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Answer'}</span>
                </button>
                
                {currentQuestionIndex < questions.length - 1 && (
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <span>Skip</span>
                    <SkipForward className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Interview Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Position:</span>
                  <p className="font-medium">{interview?.setup?.jobRole}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <p className="font-medium capitalize">{interview?.setup?.interviewType}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {interview?.setup?.skills?.map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Progress</h3>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      index < currentQuestionIndex 
                        ? 'bg-green-100 text-green-600' 
                        : index === currentQuestionIndex 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {index < currentQuestionIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        index === currentQuestionIndex ? 'font-medium text-blue-600' : 'text-gray-600'
                      }`}>
                        {question.category}
                      </p>
                      {answers[index] && (
                        <p className="text-xs text-green-600">Answered</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;