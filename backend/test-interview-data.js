/**
 * Test script to verify interview data flow
 * Run with: node test-interview-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Interview, Question, Answer } = require('./src/models');
const logger = require('./src/utils/logger');

async function testInterviewDataFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview');
    logger.info('✅ Connected to MongoDB');

    // 1. Find a recent interview
    const interview = await Interview.findOne().sort({ createdAt: -1 });
    
    if (!interview) {
      logger.info('⚠️ No interviews found in database');
      return;
    }

    logger.info(`\n📋 Testing Interview: ${interview.interviewId}`);
    logger.info(`   Title: ${interview.title}`);
    logger.info(`   Status: ${interview.status}`);
    logger.info(`   User: ${interview.userId}`);

    // 2. Find questions for this interview
    const questions = await Question.find({ interviewId: interview.interviewId })
      .sort({ questionNumber: 1 });
    
    logger.info(`\n❓ Questions Found: ${questions.length}`);
    
    if (questions.length > 0) {
      logger.info(`   Sample Question ID (UUID): ${questions[0].questionId}`);
      logger.info(`   Sample Question _id (ObjectId): ${questions[0]._id}`);
      logger.info(`   Question 1: ${questions[0].questionText.substring(0, 60)}...`);
    }

    // 3. Find answers for this interview
    const answers = await Answer.find({ interviewId: interview.interviewId });
    
    logger.info(`\n💬 Answers Found: ${answers.length}`);
    
    if (answers.length > 0) {
      logger.info(`   Sample Answer questionId reference: ${answers[0].questionId}`);
      logger.info(`   Answer 1 length: ${answers[0].userAnswer?.length || 0} chars`);
      logger.info(`   Has evaluation: ${!!answers[0].aiReview}`);
      if (answers[0].aiReview) {
        logger.info(`   Score: ${answers[0].aiReview.score}/10`);
      }
    }

    // 4. Test matching logic
    logger.info('\n🔍 Testing Answer Matching:');
    
    questions.forEach((q, idx) => {
      // This is the CORRECT matching logic
      const answer = answers.find(a => a.questionId === q.questionId);
      
      logger.info(`   Q${idx + 1} [${q.questionId.substring(0, 8)}...]: ${answer ? '✅ MATCHED' : '❌ NO MATCH'}`);
      
      if (!answer && answers[idx]) {
        logger.warn(`      → Would match by index: ${answers[idx].questionId.substring(0, 8)}...`);
      }
    });

    // 5. Summary
    logger.info('\n📊 Summary:');
    logger.info(`   ✅ Interview exists: ${!!interview}`);
    logger.info(`   ✅ Questions generated: ${questions.length > 0}`);
    logger.info(`   ✅ Answers saved: ${answers.length > 0}`);
    
    const matchedAnswers = questions.filter(q => 
      answers.find(a => a.questionId === q.questionId)
    ).length;
    
    logger.info(`   ✅ Matched Q&A pairs: ${matchedAnswers}/${questions.length}`);
    
    if (matchedAnswers < questions.length) {
      logger.warn('\n⚠️ WARNING: Not all questions have matching answers!');
      logger.warn('   This means answers are null in the interview details.');
      logger.warn('   Check that answers are being submitted with correct questionId.');
    } else {
      logger.info('\n✅ SUCCESS: All questions have matching answers!');
    }

  } catch (error) {
    logger.error('❌ Error testing interview data:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
testInterviewDataFlow();
