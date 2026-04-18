const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const { Interview, Question } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Helper function to determine quality from score
const getQualityFromScore = (score) => {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below Average';
  return 'Poor';
};

/**
 * @route   POST /api/interviews/questions/generate
 * @desc    Generate interview questions using ML-backed question system based on user setup
 * @access  Private
 * 
 * FLOW STEP 1: User provides details -> ML question system generates questions
 */
router.post('/questions/generate', authenticateToken, async (req, res) => {
  try {
    const {
      jobRole,
      customJobRole,
      skills,
      experienceLevel,
      interviewType,
      difficulty,
      duration
    } = req.body;

    // Validate required fields
    if (!jobRole || !skills || !experienceLevel || !interviewType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobRole, skills, experienceLevel, interviewType'
      });
    }

    // Validate skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be a non-empty array'
      });
    }

    // Validate numeric fields
    if (duration && (isNaN(duration) || duration < 5 || duration > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 5 and 120 minutes'
      });
    }

    const role = jobRole === 'Other' ? customJobRole : jobRole;

    logger.info(`🤖 User ${req.userId} requesting questions for: ${role}`);
    logger.info(`📋 Skills: ${skills.join(', ')}, Level: ${experienceLevel}`);

    // Create interview in database
    const interview = new Interview({
      userId: req.userId,
      title: `${role} Interview`,
      role: jobRole,
      experienceLevel,
      skillsTargeted: skills,
      durationMinutes: duration || 30,
      aiModelUsed: 'deberta-v3-base',
      status: 'pending'
    });

    await interview.save();

    // STEP 1: Ask ML question service to generate questions
    logger.info(`🤖 Calling ML question service to generate questions...`);
    const generatedQuestions = await mlService.generateQuestionsArchitecture({
      role,
      skills,
      experienceLevel
    });

    // Validate questions were generated
    if (!generatedQuestions || generatedQuestions.length === 0) {
      logger.error('❌ Failed to generate questions - empty result from ML question service');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions. Please try again.'
      });
    }

    logger.info(`✅ ML question service generated ${generatedQuestions.length} unique questions`);

    // Save questions to database
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const question = new Question({
        interviewId: interview.interviewId,
        questionNumber: i + 1,
        questionText: generatedQuestions[i].questionText,
        questionCategory: generatedQuestions[i].category || 'General',
        difficulty: generatedQuestions[i].difficulty || 'Medium',
        aiGenerated: true
      });
      await question.save();

      // Transform for frontend compatibility - add 'question' field
      const questionForFrontend = {
        ...question.toObject(),
        id: question.questionId,
        question: question.questionText, // Add 'question' field for compatibility
        category: question.questionCategory,
        type: interviewType === 'technical' ? 'technical' : 'behavioral',
        hints: ['Take your time to think through your answer', 'Provide specific examples if possible'],
        evaluationCriteria: ['Technical knowledge', 'Problem-solving approach', 'Communication clarity']
      };

      savedQuestions.push(questionForFrontend);
    }

    logger.info(`Generated ${savedQuestions.length} questions for interview ${interview.interviewId}`);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        questions: savedQuestions,
        setup: {
          jobRole,
          customJobRole,
          skills,
          experienceLevel,
          interviewType,
          difficulty: difficulty || 'medium',
          duration: duration || 30
        },
        totalQuestions: savedQuestions.length,
        estimatedDuration: `${Math.ceil(savedQuestions.length * 4)} minutes`
      }
    });

  } catch (error) {
    logger.error('Error generating interview questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/interviews/:interviewId/answer
 * @desc    Store user's answer (NO EVALUATION - evaluation happens only at the end)
 * @access  Private
 */
router.post('/:interviewId/answer', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionId, answer, questionText, timeSpent } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and answer are required'
      });
    }

    logger.info(`Storing answer for interview ${interviewId}, question ${questionId} (NO evaluation yet)`);

    // Store answer in database WITHOUT evaluation
    // Evaluation will happen only when all answers are submitted together
    try {
      const Answer = require('../models/Answer');

      // Check if answer already exists
      let answerDoc = await Answer.findOne({ interviewId, questionId });

      if (answerDoc) {
        // Update existing answer
        answerDoc.userAnswer = answer;
        answerDoc.answerTimeSeconds = timeSpent || 0;
        await answerDoc.save();
        logger.info(`Updated answer for question ${questionId}`);
      } else {
        // Create new answer
        answerDoc = new Answer({
          interviewId,
          questionId,
          userAnswer: answer,
          answerTimeSeconds: timeSpent || 0
          // NO aiReview field - evaluation comes later
        });
        await answerDoc.save();
        logger.info(`Created new answer for question ${questionId}`);
      }

      res.json({
        success: true,
        message: 'Answer saved successfully',
        data: {
          questionId,
          saved: true,
          submittedAt: new Date().toISOString()
        }
      });

    } catch (dbError) {
      logger.error('Error saving answer to database:', dbError);
      throw new Error('Failed to save answer');
    }

  } catch (error) {
    logger.error('Error storing answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/interviews/:interviewId/submit
 * @desc    Submit all answers together and get ML evaluation (ONLY evaluation point)
 * @access  Private
 * 
 * FLOW:
 * 1. User provides setup details
 * 2. ML question service generates questions
 * 3. User answers all questions (stored without evaluation)
 * 4. This endpoint: Send ALL questions + answers for comprehensive ML evaluation
 * 5. Return ML evaluation results
 */
router.post('/:interviewId/submit', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questions, answers, interviewSetup } = req.body;

    if (!questions || !answers || !interviewSetup) {
      return res.status(400).json({
        success: false,
        message: 'Questions, answers, and interview setup are required'
      });
    }

    logger.info(`🤖 Sending complete interview for ML evaluation: ${interviewId}`);
    logger.info(`📊 Questions: ${questions.length}, Answers: ${answers.length}`);

    // Save answers to database FIRST before evaluating
    const Answer = require('../models/Answer');
    const savedAnswers = [];

    for (let i = 0; i < answers.length; i++) {
      const answerData = answers[i];
      if (answerData.answer && answerData.answer.trim()) {
        try {
          // Check if answer already exists for this question
          let existingAnswer = await Answer.findOne({
            interviewId: interviewId,
            questionId: answerData.questionId
          });

          if (existingAnswer) {
            // Update existing answer
            existingAnswer.userAnswer = answerData.answer;
            existingAnswer.answerTimeSeconds = answerData.timeSpent || 0;
            await existingAnswer.save();
            savedAnswers.push(existingAnswer);
            logger.info(`Updated existing answer for question ${answerData.questionId}`);
          } else {
            // Create new answer
            const newAnswer = new Answer({
              interviewId: interviewId,
              questionId: answerData.questionId,
              userAnswer: answerData.answer,
              answerTimeSeconds: answerData.timeSpent || 0
            });
            await newAnswer.save();
            savedAnswers.push(newAnswer);
            logger.info(`Saved new answer for question ${answerData.questionId}`);
          }
        } catch (saveError) {
          logger.error(`Error saving answer for question ${answerData.questionId}:`, saveError);
        }
      }
    }

    logger.info(`✅ Saved ${savedAnswers.length} answers to database`);

    // NOW send everything for comprehensive ML evaluation
    // This is the ONLY place where full interview evaluation runs
    logger.info(`🤖 Calling ML service to evaluate all answers together...`);
    const evaluation = await mlService.evaluateAllAnswers(questions, answers, interviewSetup);
    logger.info(`✅ ML evaluation completed. Overall score: ${evaluation.overallScore}`);

    // Find the interview in database
    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Update interview with results
    interview.completeInterview({
      overallScore: Math.round(evaluation.overallScore * 10),
      technicalScore: evaluation.technicalScore ? Math.round(evaluation.technicalScore * 10) : null,
      communicationScore: evaluation.communicationScore ? Math.round(evaluation.communicationScore * 10) : null,
      confidenceScore: evaluation.confidenceScore ? Math.round(evaluation.confidenceScore * 10) : null,
      verdict: evaluation.recommendation || '',
      strengths: evaluation.overallStrengths || [],
      improvements: evaluation.overallImprovements || [],
      answeredQuestions: answers.filter(a => a.answer && a.answer.trim()).length
    });

    await interview.save();

    logger.info(`Saved interview results for ${interviewId}`);

    // Get questions to return with results
    const interviewQuestions = await Question.find({ interviewId }).sort({ questionNumber: 1 });

    logger.info(`Processing ${interviewQuestions.length} questions with ${answers.length} answers`);
    logger.info(`Evaluation has ${evaluation.individualEvaluations?.length || 0} individual evaluations`);

    // Save AI evaluations back to Answer documents
    if (evaluation.individualEvaluations && evaluation.individualEvaluations.length > 0) {
      for (let i = 0; i < evaluation.individualEvaluations.length; i++) {
        const individualEval = evaluation.individualEvaluations[i];
        const question = interviewQuestions[i];

        if (question && individualEval) {
          try {
            const answer = await Answer.findOne({
              interviewId: interviewId,
              questionId: question.questionId
            });

            if (answer) {
              const score = parseFloat(individualEval.score) || 0;
              answer.aiReview = {
                score: score,
                maxScore: 10,
                technicalScore: parseFloat(individualEval.technicalScore) || score,
                communicationScore: parseFloat(individualEval.communicationScore) || score,
                quality: getQualityFromScore(score),
                feedback: individualEval.feedback || '',
                missingPoints: Array.isArray(individualEval.improvements) ? individualEval.improvements : [],
                improvementTip: Array.isArray(individualEval.strengths) ? individualEval.strengths.join('. ') : ''
              };
              await answer.save();
              logger.info(`Saved evaluation for question ${question.questionNumber}, score: ${score}`);
            }
          } catch (evalSaveError) {
            logger.error(`Error saving evaluation for question ${question.questionNumber}:`, evalSaveError);
          }
        }
      }
      logger.info('✅ All evaluations saved to database');
    }

    // Create detailed results with questions
    const detailedResults = {
      interviewId,
      id: interviewId,
      jobRole: interview.role,
      skills: interview.skillsTargeted,
      experienceLevel: interview.experienceLevel,
      interviewType: interviewSetup.interviewType,
      difficulty: interviewSetup.difficulty || 'medium',
      totalQuestions: interviewQuestions.length,
      answeredQuestions: answers.filter(a => a.answer && a.answer.trim()).length,
      overallScore: interview.results.overallScore,
      technicalScore: interview.results.technicalScore,
      communicationScore: interview.results.communicationScore,
      confidenceScore: interview.results.confidenceScore,
      verdict: interview.results.verdict,
      strengths: interview.results.strengths,
      improvements: interview.results.improvements,
      technicalAssessment: evaluation.technicalAssessment,
      communicationAssessment: evaluation.communicationAssessment,
      recommendation: evaluation.recommendation,
      detailedFeedback: evaluation.detailedFeedback,
      status: interview.status,
      completedAt: interview.completedAt,
      date: interview.completedAt,
      questions: interviewQuestions.map((q, idx) => {
        // Find answer by questionId (UUID to UUID match)
        const answer = answers.find(a => a.questionId === q.questionId) || answers[idx];

        // Find individual evaluation by questionId  
        let individualEval = null;
        if (evaluation.individualEvaluations && evaluation.individualEvaluations.length > 0) {
          // Try to find by questionId matching
          individualEval = evaluation.individualEvaluations.find(e =>
            e.questionId === q.questionId
          );

          // Fallback to array index if not found by ID
          if (!individualEval && evaluation.individualEvaluations[idx]) {
            individualEval = evaluation.individualEvaluations[idx];
            logger.info(`Using index-based evaluation for Q${idx + 1}`);
          }
        }

        const userAnswer = answer?.answer || '';
        const hasAnswer = userAnswer && userAnswer.trim().length > 0;

        logger.info(`Q${idx + 1} [${q.questionId.substring(0, 8)}]: Answer=${hasAnswer}, Eval=${!!individualEval}, Score=${individualEval?.score || 0}`);

        return {
          id: q.questionId, // Use questionId consistently
          questionId: q.questionId,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          question: q.questionText,
          category: q.questionCategory,
          difficulty: q.difficulty,
          answer: userAnswer,
          userAnswer: userAnswer,
          evaluation: individualEval ? {
            score: Math.round(individualEval.score * 10), // Convert 0-10 scale to 0-100 percentage
            strengths: individualEval.strengths || [],
            improvements: individualEval.improvements || [],
            feedback: individualEval.feedback || 'Answer evaluated'
          } : {
            score: hasAnswer ? 50 : 0,
            strengths: hasAnswer ? ['Provided an answer'] : [],
            improvements: hasAnswer ? ['Add more detail to your response'] : ['Answer was not provided'],
            feedback: hasAnswer ? 'Answer received but not evaluated' : 'No answer provided'
          }
        };
      })
    };

    res.json({
      success: true,
      data: detailedResults
    });

  } catch (error) {
    logger.error('Error submitting interview:', error);
    logger.error('Error stack:', error.stack);

    // Provide more specific error messages
    let statusCode = 500;
    let message = 'Failed to submit interview';

    if (error.message.includes('Interview not found')) {
      statusCode = 404;
      message = 'Interview not found';
    } else if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      statusCode = 401;
      message = 'Authentication failed';
    } else if (error.message.includes('Validation')) {
      statusCode = 400;
      message = 'Invalid data provided';
    } else if (error.message.includes('ML') || error.message.includes('API')) {
      message = 'AI evaluation service temporarily unavailable';
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        interviewId: req.params.interviewId,
        userId: req.userId,
        stack: error.stack
      } : undefined
    });
  }
});

/**
 * @route   POST /api/interviews/:interviewId/followup
 * @desc    Generate follow-up question based on previous answer
 * @access  Private
 */
router.post('/:interviewId/followup', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { originalQuestion, previousAnswer } = req.body;

    if (!originalQuestion || !previousAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Original question and previous answer are required'
      });
    }

    logger.info(`Generating follow-up question for interview ${interviewId}`);

    // Generate follow-up question using ML service
    const followUpQuestion = await mlService.generateFollowUpQuestion({
      originalQuestion,
      previousAnswer,
      interviewId,
      userId: req.user.id
    });

    if (!followUpQuestion) {
      return res.status(200).json({
        success: true,
        data: {
          hasFollowUp: false,
          message: 'No follow-up question generated'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasFollowUp: true,
        question: followUpQuestion,
        type: 'followup',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error generating follow-up question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/history
 * @desc    Get user's interview history
 * @access  Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter = { userId: req.userId };
    if (status !== 'all') {
      filter.status = status;
    }

    // Get interviews from database
    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean();

    // Get total count for pagination
    const total = await Interview.countDocuments(filter);

    // Transform data for frontend
    const formattedInterviews = interviews.map(interview => ({
      id: interview.interviewId,
      interviewId: interview.interviewId,
      jobRole: interview.role,
      skills: interview.skillsTargeted,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.title.toLowerCase().includes('technical') ? 'technical' :
        interview.title.toLowerCase().includes('behavioral') ? 'behavioral' : 'mixed',
      score: interview.results?.overallScore || 0,
      overallScore: interview.results?.overallScore || 0,
      status: interview.status,
      duration: interview.calculateActualDuration ?
        `${interview.calculateActualDuration()} minutes` :
        `${interview.durationMinutes} minutes`,
      actualDuration: interview.completedAt && interview.startedAt ?
        Math.round((new Date(interview.completedAt) - new Date(interview.startedAt)) / 60000) :
        null,
      createdAt: interview.createdAt,
      completedAt: interview.completedAt,
      date: interview.completedAt || interview.createdAt,
      results: interview.results,
      strengths: interview.results?.strengths || [],
      improvements: interview.results?.improvements || []
    }));

    logger.info(`Retrieved ${formattedInterviews.length} interviews for user ${req.userId}`);

    res.json({
      success: true,
      data: {
        interviews: formattedInterviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching interview history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/statistics
 * @desc    Get user's interview statistics for dashboard
 * @access  Private
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all completed interviews for user
    const completedInterviews = await Interview.find({
      userId,
      status: 'completed'
    }).select('results createdAt completedAt').lean();

    const totalInterviews = completedInterviews.length;

    if (totalInterviews === 0) {
      return res.json({
        success: true,
        data: {
          totalInterviews: 0,
          avgScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalTime: 0,
          thisWeek: 0,
          thisMonth: 0,
          recentTrend: 'stable'
        }
      });
    }

    // Calculate statistics
    const scores = completedInterviews.map(i => i.results?.overallScore || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Calculate time statistics
    let totalMinutes = 0;
    completedInterviews.forEach(interview => {
      if (interview.completedAt && interview.createdAt) {
        totalMinutes += Math.round((new Date(interview.completedAt) - new Date(interview.createdAt)) / 60000);
      }
    });

    // Calculate this week's interviews
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = completedInterviews.filter(i => new Date(i.createdAt) > oneWeekAgo).length;

    // Calculate this month's interviews
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const thisMonth = completedInterviews.filter(i => new Date(i.createdAt) > oneMonthAgo).length;

    // Calculate trend (compare last 5 vs previous 5)
    let recentTrend = 'stable';
    if (totalInterviews >= 10) {
      const recent5 = scores.slice(0, 5);
      const previous5 = scores.slice(5, 10);
      const recentAvg = recent5.reduce((a, b) => a + b, 0) / 5;
      const previousAvg = previous5.reduce((a, b) => a + b, 0) / 5;
      if (recentAvg > previousAvg + 5) recentTrend = 'improving';
      else if (recentAvg < previousAvg - 5) recentTrend = 'declining';
    }

    logger.info(`Retrieved statistics for user ${userId}`);

    res.json({
      success: true,
      data: {
        totalInterviews,
        avgScore,
        highestScore,
        lowestScore,
        totalTime: totalMinutes,
        thisWeek,
        thisMonth,
        recentTrend
      }
    });

  } catch (error) {
    logger.error('Error fetching interview statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/:interviewId/summary
 * @desc    Get interview summary and overall evaluation
 * @access  Private
 */
router.get('/:interviewId/summary', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // TODO: Get interview data from database
    // For now, return a placeholder summary

    logger.info(`Generating summary for interview ${interviewId}`);

    const summary = {
      interviewId,
      userId: req.user.id,
      status: 'completed',
      totalQuestions: 8,
      answeredQuestions: 6,
      averageScore: 7.2,
      totalDuration: '28 minutes',
      strengths: [
        'Strong technical knowledge',
        'Clear communication',
        'Good problem-solving approach'
      ],
      improvements: [
        'Could provide more specific examples',
        'Consider edge cases in solutions',
        'Practice explaining complex concepts simply'
      ],
      overallFeedback: 'Good performance overall. Continue practicing to improve confidence and technical depth.',
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error generating interview summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interview summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/interviews/:interviewId
 * @desc    Get individual interview details by ID
 * @access  Private
 */
router.get('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }

    logger.info(`Fetching interview details for ${interviewId}`);

    // Find interview by interviewId
    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify interview belongs to the authenticated user
    if (interview.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this interview'
      });
    }

    // Get questions for this interview
    const questions = await Question.find({ interviewId })
      .sort({ questionNumber: 1 });

    // Validate questions exist
    if (questions.length === 0) {
      logger.warn(`No questions found for interview ${interviewId}`);
    }

    // Get answers for this interview
    const Answer = require('../models/Answer');
    const answers = await Answer.find({ interviewId });

    logger.info(`Found ${questions.length} questions and ${answers.length} answers for interview ${interviewId}`);

    // Log question and answer IDs for debugging
    if (questions.length > 0) {
      logger.info(`Sample question ID: ${questions[0].questionId}`);
    }
    if (answers.length > 0) {
      logger.info(`Sample answer questionId reference: ${answers[0].questionId}`);
    }

    // Format response data
    const interviewData = {
      id: interview.interviewId,
      interviewId: interview.interviewId,
      title: interview.title,
      jobRole: interview.role,
      skills: interview.skillsTargeted,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.title.toLowerCase().includes('technical') ? 'technical' :
        interview.title.toLowerCase().includes('behavioral') ? 'behavioral' : 'mixed',
      difficulty: interview.difficulty || 'Medium',
      status: interview.status,
      totalQuestions: questions.length,
      answeredQuestions: interview.results?.answeredQuestions || 0,
      score: interview.results?.overallScore || 0,
      overallScore: interview.results?.overallScore || 0,
      duration: interview.durationMinutes,
      actualDuration: interview.completedAt && interview.startedAt ?
        Math.round((new Date(interview.completedAt) - new Date(interview.startedAt)) / 60000) :
        null,
      timeTaken: interview.completedAt && interview.startedAt ?
        `${Math.round((new Date(interview.completedAt) - new Date(interview.startedAt)) / 60000)} min` :
        `${interview.durationMinutes} min`,
      createdAt: interview.createdAt,
      startedAt: interview.startedAt,
      completedAt: interview.completedAt,
      date: interview.completedAt || interview.createdAt,
      results: interview.results,
      strengths: interview.results?.strengths || [],
      improvements: interview.results?.improvements || [],
      overallFeedback: interview.results?.overallFeedback || '',
      questions: questions.map((q, idx) => {
        // Match answer using questionId (UUID), NOT MongoDB _id
        const answer = answers.find(a => a.questionId === q.questionId);

        // Log matching attempts for debugging
        if (idx === 0) {
          logger.info(`Matching Q${idx + 1}: questionId=${q.questionId}, found answer: ${!!answer}`);
        }

        return {
          id: q.questionId, // Use questionId for frontend
          questionId: q.questionId, // UUID identifier
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          question: q.questionText,
          questionCategory: q.questionCategory,
          category: q.questionCategory,
          difficulty: q.difficulty,
          answer: answer?.userAnswer || '',
          userAnswer: answer?.userAnswer || '',
          timeSpent: answer?.answerTimeSeconds || 0,
          // Format evaluation to match Results page expectations
          evaluation: answer?.aiReview ? {
            score: Math.round((answer.aiReview.score / (answer.aiReview.maxScore || 10)) * 100), // Convert to percentage
            quality: answer.aiReview.quality || 'Not Evaluated',
            feedback: answer.aiReview.feedback || '',
            missingPoints: answer.aiReview.missingPoints || [],
            improvements: answer.aiReview.missingPoints || [],
            improvementTip: answer.aiReview.improvementTip || '',
            suggestions: answer.aiReview.improvementTip ? [answer.aiReview.improvementTip] : []
          } : null,
          aiReview: answer?.aiReview || null,
          hasAnswer: !!answer
        };
      })
    };

    logger.info(`Successfully retrieved interview ${interviewId}`);

    res.json({
      success: true,
      data: interviewData
    });

  } catch (error) {
    logger.error('Error fetching interview details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/interviews/:interviewId
 * @desc    Delete an interview record
 * @access  Private
 */
router.delete('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // TODO: Delete interview from database
    // TODO: Verify interview belongs to authenticated user

    logger.info(`Deleting interview ${interviewId} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Interview deleted successfully',
      data: {
        interviewId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error deleting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;