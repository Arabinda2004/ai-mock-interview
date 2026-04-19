import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Home,
  Share2,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import interviewService from '../services/interviewService';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Check if we should redirect immediately
    if (shouldRedirect) {
      console.log('⚠️ Redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [shouldRedirect, navigate]);

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      setShouldRedirect(false);

      // Get results from location state or localStorage
      const resultData = location.state?.results || interviewService.getLastResults();

      console.log('📊 Results page - received data:', resultData);
      console.log('📊 Location state:', location.state);

      // Log the structure to help debug
      if (resultData) {
        console.log('📊 Data structure:', {
          hasQuestions: !!resultData.questions,
          questionsLength: resultData.questions?.length,
          hasAnswers: !!resultData.answers,
          answersLength: resultData.answers?.length,
          hasQuestionResults: !!resultData.questionResults,
          sampleQuestion: resultData.questions?.[0]
        });
      }

      if (!resultData) {
        console.log('❌ No result data found, redirecting to dashboard');
        console.log('❌ Location:', location);
        console.log('❌ Location state:', location.state);
        setLoading(false);
        setShouldRedirect(true);
        return;
      }

      // Check if we have an interviewId (either directly or as id field)
      const interviewId = resultData.interviewId || resultData.id;

      console.log('🔍 Interview ID:', interviewId);

      if (!interviewId) {
        console.log('❌ No interview ID found in data');
        setError('Interview ID not found. Unable to load details.');
        setLoading(false);
        return;
      }

      // If we have an interviewId but incomplete data (no questions), fetch full details from API
      const hasQuestions = resultData.questions && Array.isArray(resultData.questions) && resultData.questions.length > 0;
      console.log('🔍 Has questions?', hasQuestions, 'Questions:', resultData.questions);

      if (!hasQuestions) {
        console.log('📡 Fetching complete interview details from API for interview:', interviewId);

        try {
          const response = await interviewService.getInterviewDetails(interviewId);
          console.log('✅ API Response:', response);

          if (response.success && response.data) {
            console.log('✅ Setting results from API');
            setResults(response.data);
            saveToHistory(response.data);
          } else {
            console.log('⚠️ API returned success=false, using fallback data');
            // Fallback to whatever data we have
            setResults(resultData);
            saveToHistory(resultData);
          }
        } catch (apiError) {
          console.error('❌ Error fetching interview details from API:', apiError);
          // Fallback to the data we have (it might have some info even without questions)
          setResults(resultData);
          saveToHistory(resultData);
        }
      } else {
        console.log('✅ Using complete data from location state');
        // We have complete data, use it directly
        setResults(resultData);
        saveToHistory(resultData);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading results:', error);
      setError('Failed to load interview results. Please try again.');
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

  const normalizePercent = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(100, Math.round(parsed)));
  };

  const scoreToPercent = (value, maxScore = 10) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;

    // If the score is already expressed as a percentage, keep it.
    if (parsed > 10) {
      return normalizePercent(parsed, 0);
    }

    const safeMax = Number(maxScore) > 0 ? Number(maxScore) : 10;
    return normalizePercent((parsed / safeMax) * 100, 0);
  };

  const qualityFromPercent = (scorePercent) => {
    if (scorePercent >= 90) return 'Excellent';
    if (scorePercent >= 70) return 'Good';
    if (scorePercent >= 50) return 'Average';
    if (scorePercent >= 30) return 'Below Average';
    return 'Poor';
  };

  const getConfidenceLevelFromPercent = (confidencePercent) => {
    if (confidencePercent >= 85) return 'High';
    if (confidencePercent >= 65) return 'Moderate';
    if (confidencePercent >= 40) return 'Low';
    return 'Very Low';
  };

  const getPotentialTag = (score) => {
    if (score >= 85) {
      return { label: 'HIGH POTENTIAL', className: 'bg-emerald-100 text-emerald-700' };
    }

    if (score >= 70) {
      return { label: 'STRONG POTENTIAL', className: 'bg-cyan-100 text-cyan-700' };
    }

    if (score >= 55) {
      return { label: 'DEVELOPING', className: 'bg-amber-100 text-amber-700' };
    }

    return { label: 'NEEDS COACHING', className: 'bg-rose-100 text-rose-700' };
  };

  const getRatingLabel = (scorePercent) => {
    if (scorePercent >= 85) return 'Expert';
    if (scorePercent >= 70) return 'Strong';
    if (scorePercent >= 55) return 'Developing';
    return 'Foundational';
  };

  const getQuestionScoreTone = (score) => {
    if (score >= 85) {
      return {
        chipClass: 'bg-emerald-100 text-emerald-700',
        scoreClass: 'text-emerald-700'
      };
    }

    if (score >= 70) {
      return {
        chipClass: 'bg-cyan-100 text-cyan-700',
        scoreClass: 'text-cyan-700'
      };
    }

    if (score >= 55) {
      return {
        chipClass: 'bg-amber-100 text-amber-700',
        scoreClass: 'text-amber-700'
      };
    }

    return {
      chipClass: 'bg-rose-100 text-rose-700',
      scoreClass: 'text-rose-700'
    };
  };

  const getQualityTone = (quality) => {
    const clean = String(quality || '').toLowerCase();

    if (clean === 'excellent') return 'bg-emerald-100 text-emerald-700';
    if (clean === 'good') return 'bg-cyan-100 text-cyan-700';
    if (clean === 'average') return 'bg-amber-100 text-amber-700';
    if (clean === 'below average') return 'bg-orange-100 text-orange-700';
    return 'bg-rose-100 text-rose-700';
  };

  const formatInterviewType = (value) => {
    const normalized = String(value || 'Mixed').replace(/[_-]+/g, ' ').trim();
    if (!normalized) return 'Mixed';

    return normalized
      .split(' ')
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
      .join(' ');
  };

  const formatRecordedDate = (value) => {
    const safeDate = value ? new Date(value) : new Date();
    if (Number.isNaN(safeDate.getTime())) {
      return 'Recorded recently';
    }

    return `Recorded ${safeDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  };

  const toShortAssessment = (value, fallback) => {
    if (!value) return fallback;

    const clean = String(value).trim();
    if (!clean) return fallback;

    return clean.length > 20 ? fallback : clean;
  };

  const truncateText = (value, maxLength = 260) => {
    const clean = String(value || '').trim();
    if (clean.length <= maxLength) return clean;
    return `${clean.slice(0, maxLength).trim()}...`;
  };

  const getSignalBarStates = (scorePercent) => {
    const activeBars = Math.max(1, Math.min(5, Math.round(scorePercent / 20)));
    return Array.from({ length: 5 }, (_, index) => index < activeBars);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-6 py-3"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = results.totalQuestions || results.questions?.length || 0;
  const answeredQuestions = results.answeredQuestions || results.questions?.filter(q => q.answer || q.userAnswer).length || 0;
  const overallScore = results.overallScore || results.score || 0;
  const timeTaken = results.timeTaken ? results.timeTaken : (results.actualDuration ? `${results.actualDuration} min` : '0 min');
  const interviewRole = results.jobRole || results.role || results.interviewSetup?.jobRole || 'Interview Session';
  const interviewType = formatInterviewType(results.interviewType || results.interviewSetup?.interviewType || 'Technical');
  const recordedLabel = formatRecordedDate(results.date || results.createdAt || results.completedAt);

  // Prepare question results for display - handle multiple data structures
  let questionResults = [];

  // NEW: Check if questions have embedded evaluation data (from backend submit endpoint)
  if (results.questions && Array.isArray(results.questions) && results.questions.length > 0) {
    questionResults = results.questions.map((q, index) => {
      // Check if question has answer and evaluation data
      const hasAnswer = q.answer || q.userAnswer;
      const evaluation = q.evaluation || q.aiReview;

      if (!hasAnswer && !evaluation) {
        console.warn(`Question ${index + 1} has no answer or evaluation`);
        return null;
      }

      // `evaluation.score` in backend payload is already a percentage in this path.
      // Prefer rawScore (0-10) when present; otherwise normalize score as percent.
      const score = evaluation?.rawScore !== undefined && evaluation?.rawScore !== null
        ? scoreToPercent(evaluation.rawScore, 10)
        : normalizePercent(evaluation?.score, 0);
      const missingPoints = Array.isArray(evaluation?.missingPoints)
        ? evaluation.missingPoints
        : Array.isArray(evaluation?.improvements)
          ? evaluation.improvements
          : [];

      return {
        question: q.questionText || q.question || 'Question not available',
        userAnswer: q.userAnswer || q.answer || 'Not answered',
        score,
        feedback: evaluation?.feedback || 'Evaluation pending',
        quality: evaluation?.quality || qualityFromPercent(score),
        missingPoints,
        improvementTip: evaluation?.improvementTip || evaluation?.suggestions?.join('. ') || ''
      };
    }).filter(Boolean); // Remove null entries
  }
  // FALLBACK: Old structure with separate answers array
  else if (results.questionResults) {
    questionResults = results.questionResults;
  }
  else if (results.answers && Array.isArray(results.answers)) {
    questionResults = results.answers.map((answer, index) => {
      const question = results.questions?.[index];
      if (!question) return null;

      // Score conversion: if score > 10, it's already a percentage; otherwise convert
      const rawScore = answer.aiReview?.score || 0;
      const maxScore = answer.aiReview?.maxScore || 10;
      const percentageScore = scoreToPercent(rawScore, maxScore);

      return {
        question: question.questionText || question.question || 'Question not available',
        userAnswer: answer.userAnswer || 'Not answered',
        score: percentageScore,
        feedback: answer.aiReview?.feedback || 'Evaluation pending',
        quality: answer.aiReview?.quality || qualityFromPercent(percentageScore),
        missingPoints: answer.aiReview?.missingPoints || [],
        improvementTip: answer.aiReview?.improvementTip || ''
      };
    }).filter(Boolean);
  }

  const derivedAccuracyRate = questionResults.length > 0
    ? Math.round((questionResults.filter((item) => Number(item.score) >= 60).length / questionResults.length) * 100)
    : (totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0);

  const accuracyRate = normalizePercent(results.accuracyRate, derivedAccuracyRate);
  const confidenceScore = normalizePercent(
    results.confidenceScore,
    Math.round((overallScore * 0.7) + (accuracyRate * 0.3))
  );
  const confidenceLevel = results.confidenceLevel || getConfidenceLevelFromPercent(confidenceScore);
  const technicalScore = normalizePercent(results.technicalScore, overallScore);
  const communicationScore = normalizePercent(results.communicationScore, overallScore);
  const technicalLevel = toShortAssessment(results.technicalAssessment, getRatingLabel(technicalScore));
  const communicationLevel = toShortAssessment(results.communicationAssessment, getRatingLabel(communicationScore));
  const recommendation = results.recommendation || results.verdict || 'Proceed with focused preparation before your next interview.';
  const avgResponseTime = results.avgResponseTime || results.averageResponseTime || '2m 30s';
  const potentialTag = getPotentialTag(overallScore);
  const hasMoreQuestions = questionResults.length > 3;
  const visibleQuestionResults = showAllQuestions ? questionResults : questionResults.slice(0, 3);
  const strengths = results.strengths && results.strengths.length > 0
    ? results.strengths
    : [
      'Clear technical articulation',
      'Structured reasoning',
      'Confident response framing'
    ];
  const improvements = results.improvements && results.improvements.length > 0
    ? results.improvements
    : [
      'Use more quantified outcomes',
      'Add concise real project examples',
      'Tighten response structure'
    ];
  const overallFeedbackSummary =
    results.detailedFeedback ||
    results.overallFeedback ||
    results.results?.overallFeedback ||
    '';

  console.log('📊 Question results for display:', {
    totalQuestions,
    questionResultsCount: questionResults.length,
    sampleQuestion: questionResults[0]
  });

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-slate-100/80 p-5 sm:p-7">
        <div className="grid items-start gap-6 lg:grid-cols-[1.75fr,0.95fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Session Complete</span>
              <span>{recordedLabel}</span>
            </div>

            <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-[46px] sm:leading-[1.04]">
              {interviewRole}
              <br />
              <span className="text-blue-700">{interviewType} Interview Results</span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={downloadResults}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>

              <button
                onClick={shareResults}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
              >
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-5xl font-semibold tracking-tight text-blue-700 sm:text-6xl">
                {overallScore}
                <span className="text-2xl text-slate-600">/100</span>
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${potentialTag.className}`}>
                {potentialTag.label}
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Questions Answered</span>
                <span className="font-semibold text-slate-900">{answeredQuestions} / {totalQuestions}</span>
              </div>
              <div className="h-1 rounded-full bg-slate-200">
                <div
                  className="h-1 rounded-full bg-cyan-600"
                  style={{ width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Time Taken</span>
                <span className="font-semibold text-slate-900">{timeTaken}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <Clock className="h-4 w-4 text-blue-600" />
            Avg Response
          </div>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{avgResponseTime}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Accuracy
          </div>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{accuracyRate}%</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            Confidence
          </div>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{confidenceScore}%</p>
          <p className="mt-1 text-sm font-medium text-slate-600">{confidenceLevel} confidence</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Key Strengths
          </h2>
          <ul className="mt-4 space-y-3">
            {strengths.slice(0, 4).map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-600"></span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Target className="h-5 w-5 text-amber-600" />
            Growth Opportunities
          </h2>
          <ul className="mt-4 space-y-3">
            {improvements.slice(0, 4).map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-600"></span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-800 p-5 text-slate-100 shadow-lg shadow-slate-300/35">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Overall Assessment</h2>

          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Technical Skills</p>
                <p className="text-2xl font-semibold text-white">{technicalLevel}</p>
              </div>
              <div className="flex items-end gap-1">
                {getSignalBarStates(technicalScore).map((isActive, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-sm ${isActive ? (index % 2 === 0 ? 'h-5 bg-cyan-300' : 'h-4 bg-cyan-300') : 'h-3 bg-slate-600'}`}
                  ></span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Communication</p>
                <p className="text-2xl font-semibold text-white">{communicationLevel}</p>
              </div>
              <div className="flex items-end gap-1">
                {getSignalBarStates(communicationScore).map((isActive, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-sm ${isActive ? (index % 2 === 0 ? 'h-5 bg-cyan-300' : 'h-4 bg-cyan-300') : 'h-3 bg-slate-600'}`}
                  ></span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-700 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Recommendation</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {recommendation}
            </p>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-semibold text-slate-900">Question-by-Question Analysis</h2>
          <div className="h-px flex-1 bg-slate-300"></div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[1.7fr,0.9fr]">
          <div className="space-y-4">
            {questionResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                No question-level analysis is available for this interview.
              </div>
            ) : (
              visibleQuestionResults.map((qResult, index) => {
                const scoreTone = getQuestionScoreTone(qResult.score);
                const isCondensed = !showAllQuestions && index > 0;

                if (isCondensed) {
                  return (
                    <article key={index} className="rounded-3xl border border-slate-200 bg-slate-100/80 p-5">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Q{index + 1}</span>
                          {qResult.quality && (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getQualityTone(qResult.quality)}`}>
                              {qResult.quality}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-semibold ${scoreTone.scoreClass}`}>{qResult.score}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Score</p>
                        </div>
                      </div>

                      <p className="text-xl font-medium text-slate-800">"{qResult.question}"</p>
                      <p className="mt-3 text-sm text-slate-500">Expand to see full analysis.</p>
                    </article>
                  );
                }

                return (
                  <article key={index} className="rounded-3xl border border-slate-200 bg-slate-100/80 p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Q{index + 1}</span>
                        {qResult.quality && (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getQualityTone(qResult.quality)}`}>
                            {qResult.quality}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-semibold ${scoreTone.scoreClass}`}>{qResult.score}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Score</p>
                      </div>
                    </div>

                    <p className="text-2xl font-medium leading-snug text-slate-800">"{qResult.question}"</p>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Your Response Excerpt</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">"{truncateText(qResult.userAnswer || 'No answer provided.')}"</p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">AI Feedback</p>
                        <p className="mt-1 text-sm text-cyan-900">{qResult.feedback || 'Feedback unavailable.'}</p>
                      </div>

                      <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Improvement Tip</p>
                        <p className="mt-1 text-sm text-blue-900">{qResult.improvementTip || 'Use STAR framing and include one measurable outcome.'}</p>
                      </div>
                    </div>

                    {qResult.missingPoints && qResult.missingPoints.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Missing Points</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                          {qResult.missingPoints.slice(0, 3).map((point, pointIndex) => (
                            <li key={pointIndex}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })
            )}

            {hasMoreQuestions && (
              <button
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showAllQuestions ? 'Show Less Analysis' : 'Show Full Analysis'}
                <BarChart3 className="h-4 w-4" />
              </button>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <article className="rounded-3xl border border-slate-200 bg-blue-100/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-blue-700">
                <Trophy className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">Ready to improve?</p>
              </div>
              <p className="text-sm leading-6 text-slate-700">
                Your confidence score is {confidenceScore}%. Start a new targeted session to improve weak signals and increase consistency.
              </p>
              <button
                onClick={() => navigate('/interview-setup')}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Start New Interview
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Session Actions</h3>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => navigate('/history')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Calendar className="h-4 w-4" />
                  View Interview History
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </div>
            </article>

            {overallFeedbackSummary && (
              <article className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Zap className="h-4 w-4 text-amber-600" />
                  Overall Feedback
                </h3>
                <p className="text-sm leading-6 text-slate-700">{truncateText(overallFeedbackSummary, 220)}</p>
              </article>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Results;