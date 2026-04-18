const { Interview, Answer, Question } = require('../models');
const logger = require('../utils/logger');

/**
 * Get interview results with comprehensive analytics
 * @route GET /results/:interviewId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with interview results
 */
const getInterviewResults = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }

    // Get interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get all questions
    const questions = await Question.find({ interviewId }).sort({ questionNumber: 1 });

    // Get all answers
    const answers = await Answer.find({ interviewId });

    // Calculate detailed scores
    let totalScore = 0;
    let totalMaxScore = 0;
    let technicalScoreSum = 0;
    let communicationScoreSum = 0;
    let reviewedCount = 0;

    const detailedAnswers = answers.map(answer => {
      if (answer.aiReview && answer.aiReview.score !== null && answer.aiReview.score !== undefined) {
        const score = parseFloat(answer.aiReview.score);
        const maxScore = parseFloat(answer.aiReview.maxScore || 10);
        
        if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
          totalScore += score;
          totalMaxScore += maxScore;
          reviewedCount++;

          // Technical score (use actual score directly from AI evaluation)
          // This represents the quality of technical knowledge demonstrated
          if (answer.aiReview.technicalScore !== undefined && answer.aiReview.technicalScore !== null) {
            technicalScoreSum += parseFloat(answer.aiReview.technicalScore);
          } else {
            technicalScoreSum += score;
          }
          
          // Communication score (use actual score directly from AI evaluation)
          if (answer.aiReview.communicationScore !== undefined && answer.aiReview.communicationScore !== null) {
            communicationScoreSum += parseFloat(answer.aiReview.communicationScore);
          } else {
            // Fallback to manual calculation if AI didn't provide communication score
            const wordCount = answer.userAnswer.split(/\s+/).filter(w => w.length > 0).length;
            const sentenceCount = answer.userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            
            let communicationScore = 0;
            if (wordCount >= 50) {
              communicationScore = 8; // Good length
            } else if (wordCount >= 20) {
              communicationScore = 6; // Adequate length
            } else if (wordCount >= 10) {
              communicationScore = 4; // Short but acceptable
            } else {
              communicationScore = 2; // Too short
            }
            
            // Bonus for structure (multiple sentences)
            if (sentenceCount >= 3) {
              communicationScore = Math.min(10, communicationScore + 1);
            }
            
            communicationScoreSum += communicationScore;
          }
        }
      }
      return answer;
    });

    // Calculate average scores (0-100 scale)
    const overallScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const technicalScore = reviewedCount > 0 ? (technicalScoreSum / reviewedCount) * 10 : 0;
    const communicationScore = reviewedCount > 0 ? (communicationScoreSum / reviewedCount) * 10 : 0;
    const confidenceScore = questions.length > 0 ? ((answers.length / questions.length) * 100) : 0;

    // Generate verdict based on overall score
    let verdict = '';
    if (overallScore >= 85) {
      verdict = 'Excellent performance! Strong candidate with deep technical knowledge.';
    } else if (overallScore >= 70) {
      verdict = 'Good performance. Solid understanding with minor areas for improvement.';
    } else if (overallScore >= 55) {
      verdict = 'Average performance. Shows potential but needs more preparation.';
    } else if (overallScore >= 40) {
      verdict = 'Below average. Significant gaps in knowledge that need addressing.';
    } else {
      verdict = 'Needs substantial improvement. Consider additional study and practice.';
    }

    // Collect strengths and improvements
    const strengths = [];
    const improvements = [];

    answers.forEach(answer => {
      if (answer.aiReview && answer.aiReview.score >= 8) {
        strengths.push(answer.aiReview.feedback);
      }
      if (answer.aiReview && answer.aiReview.missingPoints && answer.aiReview.missingPoints.length > 0) {
        improvements.push(...answer.aiReview.missingPoints);
      }
    });

    // Update interview results
    interview.results = {
      overallScore: Math.round(overallScore),
      technicalScore: Math.round(technicalScore),
      communicationScore: Math.round(communicationScore),
      confidenceScore: Math.round(confidenceScore),
      verdict,
      strengths: [...new Set(strengths)].slice(0, 5),
      improvements: [...new Set(improvements)].slice(0, 5)
    };

    if (interview.status === 'ongoing') {
      interview.completeInterview(interview.results);
    }

    await interview.save();

    // Format question results with proper percentage scores
    const questionResults = questions.map((question, index) => {
      const answer = answers.find(a => a.questionId === question.questionId);
      
      if (!answer) {
        return {
          question: question.questionText,
          userAnswer: 'Not answered',
          score: 0,
          feedback: 'Question was not answered',
          strengths: [],
          improvements: ['Answer was not provided'],
          quality: 'Poor'
        };
      }

      // Convert 0-10 score to 0-100 percentage
      const scoreOutOf10 = answer.aiReview?.score || 0;
      const maxScore = answer.aiReview?.maxScore || 10;
      const percentageScore = Math.round((scoreOutOf10 / maxScore) * 100);

      return {
        question: question.questionText,
        userAnswer: answer.userAnswer,
        score: percentageScore, // Percentage (0-100)
        rawScore: scoreOutOf10, // Raw score (0-10)
        feedback: answer.aiReview?.feedback || 'Evaluation pending',
        quality: answer.aiReview?.quality || 'Not Evaluated',
        missingPoints: answer.aiReview?.missingPoints || [],
        improvementTip: answer.aiReview?.improvementTip || ''
      };
    });

    logger.info(`Results retrieved for interview: ${interviewId}`);

    return res.json({
      success: true,
      data: {
        interview,
        questions,
        answers: detailedAnswers,
        questionResults, // Add formatted question results
        summary: {
          totalQuestions: questions.length,
          answeredQuestions: answers.length,
          reviewedAnswers: reviewedCount,
          results: interview.results
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve results',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getInterviewResults
};
