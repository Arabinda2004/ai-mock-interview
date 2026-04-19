import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);

  // Progress tracking
  const [answers, setAnswers] = useState({});

  // Refs for timers and speech
  const sessionTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const sessionStartTimeRef = useRef(null);

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
        sessionStartTimeRef.current = startTime;

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
  const answeredCount = Object.keys(answers).length;
  const currentWordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-500">Active Interview</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                {interview?.setup?.jobRole} Interview
              </h1>
              <p className="text-sm text-slate-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">{formatTime(sessionElapsed)}</span>
              </div>
              <button
                onClick={completeInterview}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-sm font-medium"
              >
                End Interview
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500">Overall Progress</p>
              <p className="text-xs font-semibold text-slate-700">{Math.round(getProgress())}%</p>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 sm:px-6 border-b border-slate-200 bg-slate-50/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium">
                      {currentQuestion?.category || 'General'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium capitalize">
                      {currentQuestion?.difficulty || 'Medium'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSpeech}
                      className={`p-2.5 rounded-xl transition-colors ${isSpeaking
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                    >
                      {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <p className="text-xl leading-relaxed text-slate-900 font-medium">
                  {currentQuestion?.question}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1.5">
                    <Clock className="h-4 w-4" />
                    Time on this question: {formatTime(questionElapsed)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-3 py-1.5">
                    Expected: {currentQuestion?.expectedDuration || '2-4 min'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-800">
                      Your Answer
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{currentWordCount} words</span>
                      <button
                        onClick={toggleRecording}
                        className={`p-2 rounded-lg transition-colors ${isRecording
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        title={isRecording ? 'Stop recording' : 'Start voice recording'}
                      >
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Explain your approach clearly, mention trade-offs, and give an example where possible."
                    className="w-full h-48 p-4 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="text-blue-700 hover:text-blue-800 text-sm font-semibold flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{showHints ? 'Hide' : 'Show'} AI Hints</span>
                    </button>

                    {showHints && (
                      <ul className="mt-3 space-y-2">
                        {currentQuestion.hints.map((hint, index) => (
                          <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="mt-1 text-blue-500">•</span>
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {currentQuestion?.evaluationCriteria && currentQuestion.evaluationCriteria.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-2">What will be evaluated</p>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.evaluationCriteria.map((criterion, index) => (
                        <span key={index} className="inline-flex items-center rounded-full bg-white border border-amber-200 text-amber-900 px-3 py-1 text-xs font-medium">
                          {criterion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous Question
              </button>

              <div className="flex flex-wrap gap-3 sm:justify-end">
                {currentQuestionIndex < questions.length - 1 && (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <span>Skip for now</span>
                    <SkipForward className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isSubmitting}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Answer'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Session Snapshot</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Answered</p>
                  <p className="text-xl font-semibold text-slate-900">{answeredCount}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="text-xl font-semibold text-slate-900">{Math.max(questions.length - answeredCount, 0)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 col-span-2">
                  <p className="text-xs text-slate-500">Question Timer</p>
                  <p className="text-xl font-semibold text-slate-900 font-mono">{formatTime(questionElapsed)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Interview Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-500">Position</span>
                  <p className="font-medium text-slate-800">{interview?.setup?.jobRole}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Type</span>
                  <p className="font-medium text-slate-800 capitalize">{interview?.setup?.interviewType}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {interview?.setup?.skills?.map((skill, index) => (
                      <span key={index} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Question Flow</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {questions.map((question, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${index < currentQuestionIndex
                        ? 'bg-emerald-100 text-emerald-700'
                        : index === currentQuestionIndex
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                      {index < currentQuestionIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${index === currentQuestionIndex ? 'font-semibold text-blue-700' : 'text-slate-700'
                        }`}>
                        {question.category || `Question ${index + 1}`}
                      </p>
                      {answers[index] && <p className="text-xs text-emerald-600">Answered</p>}
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