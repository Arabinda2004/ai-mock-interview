const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize Gemini AI with API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.warn('GEMINI_API_KEY not found in environment variables');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      // Updated to use the current Gemini model name
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      logger.info('Gemini AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini AI service:', error);
    }
  }

  /**
   * Generate interview questions based on user preferences
   * @param {Object} interviewSetup - User's interview setup data
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateInterviewQuestions(interviewSetup) {
    try {
      if (!this.model) {
        throw new Error('Gemini AI service not initialized');
      }

      const {
        jobRole,
        customJobRole,
        skills,
        experienceLevel,
        interviewType,
        difficulty,
        duration
      } = interviewSetup;

      // Calculate number of questions based on duration
      const questionCount = this.calculateQuestionCount(duration, interviewType);

      // Build the prompt
      const prompt = this.buildQuestionGenerationPrompt({
        jobRole: jobRole === 'Other' ? customJobRole : jobRole,
        skills,
        experienceLevel,
        interviewType,
        difficulty,
        questionCount
      });

      // Generate content
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response into structured questions
      const questions = this.parseQuestionResponse(text, questionCount);

      logger.info(`Generated ${questions.length} questions for ${jobRole} interview`);
      return questions;

    } catch (error) {
      logger.error('Error generating interview questions:', error);
      
      // Return fallback questions if Gemini fails
      return this.getFallbackQuestions(interviewSetup);
    }
  }

  /**
   * Calculate optimal number of questions based on duration and type
   */
  calculateQuestionCount(duration, interviewType) {
    let baseQuestions;
    
    // Base questions per duration
    if (duration <= 15) baseQuestions = 5;
    else if (duration <= 30) baseQuestions = 8;
    else if (duration <= 60) baseQuestions = 12;
    else baseQuestions = 18;

    // Adjust based on interview type
    if (interviewType === 'mixed') {
      return Math.max(6, baseQuestions); // Mixed needs minimum variety
    }
    
    return Math.max(3, baseQuestions);
  }

  /**
   * Build comprehensive prompt for question generation
   */
  buildQuestionGenerationPrompt(params) {
    const { jobRole, skills, experienceLevel, interviewType, difficulty, questionCount } = params;

    let prompt = `You are an expert technical interviewer. Generate ${questionCount} high-quality interview questions for the following candidate profile:

**Job Role:** ${jobRole}
**Experience Level:** ${experienceLevel}
**Skills:** ${skills.join(', ')}
**Interview Type:** ${interviewType}
**Difficulty:** ${difficulty}

**Instructions:**
1. Generate exactly ${questionCount} questions
2. Each question should be relevant to the job role and skills
3. Adjust difficulty based on experience level (${experienceLevel})
4. Include a mix of question types appropriate for ${interviewType} interviews

**Question Categories:**`;

    // Add category-specific instructions
    if (interviewType === 'technical' || interviewType === 'mixed') {
      prompt += `
- Technical/Coding questions related to: ${skills.join(', ')}
- Problem-solving scenarios
- System design questions (for senior levels)
- Code review and debugging questions`;
    }

    if (interviewType === 'behavioral' || interviewType === 'mixed') {
      prompt += `
- Leadership and teamwork scenarios
- Problem-solving approaches
- Communication and collaboration
- Career motivation and goals`;
    }

    prompt += `

**Difficulty Guidelines:**
- Junior (0-2 years): Focus on fundamentals, basic concepts, learning ability
- Mid-Level (2-5 years): Intermediate concepts, practical experience, some leadership
- Senior (5+ years): Advanced topics, architecture, mentoring, strategic thinking

**Output Format:**
Return the questions in this exact JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "technical|behavioral|mixed",
      "category": "specific category like 'React', 'Leadership', etc.",
      "question": "The actual question text",
      "difficulty": "easy|medium|hard",
      "expectedDuration": "2-3 minutes",
      "hints": ["hint1", "hint2"],
      "evaluationCriteria": ["criteria1", "criteria2"]
    }
  ]
}

Generate diverse, engaging questions that will help assess the candidate's suitability for the ${jobRole} position.`;

    return prompt;
  }

  /**
   * Parse Gemini's response into structured questions
   */
  parseQuestionResponse(text, expectedCount) {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions.slice(0, expectedCount);
      }

      throw new Error('Invalid question format');
    } catch (error) {
      logger.error('Error parsing Gemini response:', error);
      
      // Fallback: try to extract questions from plain text
      return this.parseTextResponse(text, expectedCount);
    }
  }

  /**
   * Fallback parser for plain text responses
   */
  parseTextResponse(text, expectedCount) {
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    let currentQuestion = null;

    for (let i = 0; i < lines.length && questions.length < expectedCount; i++) {
      const line = lines[i].trim();
      
      // Look for question patterns
      if (line.match(/^\d+\./) || line.toLowerCase().includes('question')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        currentQuestion = {
          id: questions.length + 1,
          type: 'general',
          category: 'General',
          question: line.replace(/^\d+\.\s*/, ''),
          difficulty: 'medium',
          expectedDuration: '3-4 minutes',
          hints: [],
          evaluationCriteria: ['Technical knowledge', 'Problem-solving approach']
        };
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  }

  /**
   * Provide fallback questions when AI generation fails
   */
  getFallbackQuestions(interviewSetup) {
    const { jobRole, experienceLevel, interviewType } = interviewSetup;
    
    const fallbackQuestions = [
      {
        id: 1,
        type: 'behavioral',
        category: 'Introduction',
        question: 'Tell me about yourself and your experience in software development.',
        difficulty: 'easy',
        expectedDuration: '3-4 minutes',
        hints: ['Focus on relevant experience', 'Highlight key achievements'],
        evaluationCriteria: ['Communication skills', 'Relevant experience']
      },
      {
        id: 2,
        type: 'technical',
        category: 'Problem Solving',
        question: 'Describe a challenging technical problem you solved recently.',
        difficulty: 'medium',
        expectedDuration: '4-5 minutes',
        hints: ['Explain your approach', 'Mention tools and technologies used'],
        evaluationCriteria: ['Problem-solving approach', 'Technical depth']
      },
      {
        id: 3,
        type: 'behavioral',
        category: 'Teamwork',
        question: 'How do you handle disagreements with team members?',
        difficulty: 'medium',
        expectedDuration: '3-4 minutes',
        hints: ['Give specific examples', 'Focus on resolution strategies'],
        evaluationCriteria: ['Communication skills', 'Conflict resolution']
      }
    ];

    logger.info(`Using fallback questions for ${jobRole} interview`);
    return fallbackQuestions;
  }

  /**
   * Generate follow-up questions during interview
   */
  async generateFollowUpQuestion(context) {
    try {
      if (!this.model) {
        return null;
      }

      const prompt = `Based on the candidate's previous answer: "${context.previousAnswer}"

Original question was: "${context.originalQuestion}"

Generate ONE thoughtful follow-up question that:
1. Digs deeper into their response
2. Clarifies any unclear points
3. Tests their deeper understanding

Return only the follow-up question text, no additional formatting.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();

    } catch (error) {
      logger.error('Error generating follow-up question:', error);
      return null;
    }
  }

  /**
   * Evaluate candidate's answer
   */
  async evaluateAnswer(question, answer, context = {}) {
    try {
      if (!this.model) {
        return this.getFallbackEvaluation();
      }

      const prompt = `Evaluate this interview answer:

**Question:** ${question}
**Candidate's Answer:** ${answer}
**Context:** ${JSON.stringify(context)}

Provide a comprehensive evaluation with:

1. **Score (1-10):** Overall quality of the answer
2. **Strengths:** What the candidate did well
3. **Areas for Improvement:** What could be better
4. **Technical Accuracy:** Assessment of technical content (if applicable)
5. **Communication:** Clarity and structure of response
6. **Suggestions:** Specific advice for improvement

Return evaluation in JSON format:
{
  "score": 7,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "technicalAccuracy": "assessment text",
  "communication": "assessment text",
  "suggestions": ["suggestion1", "suggestion2"],
  "overallFeedback": "comprehensive feedback text"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        logger.error('Error parsing evaluation response:', parseError);
      }

      return this.getFallbackEvaluation();

    } catch (error) {
      logger.error('Error evaluating answer:', error);
      return this.getFallbackEvaluation();
    }
  }

  /**
   * Fallback evaluation when AI fails
   */
  getFallbackEvaluation() {
    return {
      score: 6,
      strengths: ['Attempted to answer the question'],
      improvements: ['Could provide more specific examples', 'Consider technical details'],
      technicalAccuracy: 'Unable to assess technical accuracy at this time',
      communication: 'Response received and acknowledged',
      suggestions: ['Practice explaining concepts clearly', 'Prepare specific examples'],
      overallFeedback: 'Thank you for your response. Continue practicing to improve your interview skills.'
    };
  }
}

module.exports = new GeminiService();