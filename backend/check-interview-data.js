/**
 * Quick debug script to check interview data in database
 * Run with: node check-interview-data.js <interviewId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Interview, Question, Answer } = require('./src/models');
const logger = require('./src/utils/logger');

async function checkInterviewData(interviewId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview');
    logger.info('✅ Connected to MongoDB');

    if (!interviewId) {
      // Show latest interview if no ID provided
      const latestInterview = await Interview.findOne().sort({ createdAt: -1 });
      if (latestInterview) {
        interviewId = latestInterview.interviewId;
        logger.info(`📋 No interview ID provided, using latest: ${interviewId}`);
      } else {
        logger.error('❌ No interviews found in database');
        return;
      }
    }

    // 1. Find interview
    const interview = await Interview.findOne({ interviewId });
    
    if (!interview) {
      logger.error(`❌ Interview ${interviewId} not found`);
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 INTERVIEW DETAILS');
    console.log('='.repeat(80));
    console.log(`ID: ${interview.interviewId}`);
    console.log(`Title: ${interview.title}`);
    console.log(`Status: ${interview.status}`);
    console.log(`User: ${interview.userId}`);
    console.log(`Created: ${interview.createdAt}`);
    console.log(`Completed: ${interview.completedAt || 'Not completed'}`);
    
    if (interview.results) {
      console.log(`Overall Score: ${interview.results.overallScore || 'N/A'}`);
      console.log(`Answered: ${interview.results.answeredQuestions || 0} questions`);
    }

    // 2. Find questions
    const questions = await Question.find({ interviewId })
      .sort({ questionNumber: 1 });
    
    console.log('\n' + '='.repeat(80));
    console.log(`❓ QUESTIONS (${questions.length} found)`);
    console.log('='.repeat(80));
    
    if (questions.length === 0) {
      console.log('⚠️  NO QUESTIONS FOUND - This is the problem!');
      console.log('   Questions need to be generated and saved first.');
    } else {
      questions.forEach((q, idx) => {
        console.log(`\n${idx + 1}. [${q.questionId.substring(0, 8)}...] ${q.questionText.substring(0, 60)}...`);
        console.log(`   Category: ${q.questionCategory} | Difficulty: ${q.difficulty}`);
      });
    }

    // 3. Find answers
    const answers = await Answer.find({ interviewId });
    
    console.log('\n' + '='.repeat(80));
    console.log(`💬 ANSWERS (${answers.length} found)`);
    console.log('='.repeat(80));
    
    if (answers.length === 0) {
      console.log('⚠️  NO ANSWERS FOUND - This is the problem!');
      console.log('   Answers need to be submitted and saved to database.');
    } else {
      answers.forEach((a, idx) => {
        const question = questions.find(q => q.questionId === a.questionId);
        const matched = question ? '✅' : '❌';
        console.log(`\n${idx + 1}. ${matched} [${a.questionId.substring(0, 8)}...]`);
        console.log(`   Answer length: ${a.userAnswer?.length || 0} chars`);
        console.log(`   Time spent: ${a.answerTimeSeconds || 0}s`);
        if (a.aiReview) {
          console.log(`   Score: ${a.aiReview.score}/10 (${a.aiReview.quality || 'N/A'})`);
          console.log(`   Feedback: ${a.aiReview.feedback?.substring(0, 60) || 'N/A'}...`);
        } else {
          console.log('   ⚠️  NO EVALUATION');
        }
        if (!question) {
          console.log('   ⚠️  ORPHANED ANSWER - No matching question!');
        }
      });
    }

    // 4. Matching summary
    console.log('\n' + '='.repeat(80));
    console.log('🔍 MATCHING ANALYSIS');
    console.log('='.repeat(80));
    
    const matchedCount = questions.filter(q => 
      answers.find(a => a.questionId === q.questionId)
    ).length;
    
    console.log(`Questions: ${questions.length}`);
    console.log(`Answers: ${answers.length}`);
    console.log(`Matched pairs: ${matchedCount}`);
    console.log(`Unmatched questions: ${questions.length - matchedCount}`);
    console.log(`Orphaned answers: ${answers.length - matchedCount}`);
    
    if (matchedCount === questions.length && questions.length > 0) {
      console.log('\n✅ SUCCESS: All questions have matching answers!');
    } else if (questions.length === 0) {
      console.log('\n❌ PROBLEM: No questions generated!');
      console.log('   → Run interview question generation first');
    } else if (answers.length === 0) {
      console.log('\n❌ PROBLEM: No answers saved!');
      console.log('   → Submit interview answers to save them');
    } else {
      console.log('\n⚠️  WARNING: Incomplete data!');
      console.log(`   → ${questions.length - matchedCount} questions without answers`);
    }

    // 5. Sample API response
    console.log('\n' + '='.repeat(80));
    console.log('📡 SAMPLE API RESPONSE STRUCTURE');
    console.log('='.repeat(80));
    
    const sampleData = {
      interviewId: interview.interviewId,
      totalQuestions: questions.length,
      answeredQuestions: answers.length,
      overallScore: interview.results?.overallScore || 0,
      questions: questions.slice(0, 1).map(q => {
        const answer = answers.find(a => a.questionId === q.questionId);
        return {
          questionId: q.questionId,
          questionText: q.questionText,
          answer: answer?.userAnswer || '',
          evaluation: answer?.aiReview ? {
            score: Math.round((answer.aiReview.score / 10) * 100),
            quality: answer.aiReview.quality,
            feedback: answer.aiReview.feedback
          } : null
        };
      })
    };
    
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (error) {
    logger.error('❌ Error checking interview data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

// Get interview ID from command line or use latest
const interviewId = process.argv[2];
checkInterviewData(interviewId);
