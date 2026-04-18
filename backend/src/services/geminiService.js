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
      
      // Try to use the latest model, fallback to older models if needed
      // Models to try in order of preference
      const modelPreferences = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-pro'
      ];
      
      // Use the first model in preferences (will fallback during actual API calls if needed)
      this.model = this.genAI.getGenerativeModel({ model: modelPreferences[0] });
      this.modelName = modelPreferences[0];
      this.modelFallbacks = modelPreferences.slice(1);
      
      logger.info(`Gemini AI service initialized successfully with model: ${this.modelName}`);
    } catch (error) {
      logger.error('Failed to initialize Gemini AI service:', error);
    }
  }

  /**
   * Generate content with automatic model fallback
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<Object>} The API response
   */
  async generateContentWithFallback(prompt) {
    if (!this.genAI) {
      throw new Error('Gemini AI service not initialized');
    }

    const modelsToTry = [this.modelName, ...this.modelFallbacks];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info(`Attempting to generate content with model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // If successful, update the current model
        if (this.modelName !== modelName) {
          logger.info(`Successfully switched to model: ${modelName}`);
          this.model = model;
          this.modelName = modelName;
        }
        
        return response;
      } catch (error) {
        lastError = error;
        logger.warn(`Model ${modelName} failed: ${error.message}`);
        
        // If this is not a 404, don't try other models
        if (!error.message.includes('404') && !error.message.includes('not found')) {
          throw error;
        }
      }
    }

    // All models failed
    throw lastError || new Error('All Gemini models failed');
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

      // Generate content with automatic fallback
      const response = await this.generateContentWithFallback(prompt);
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

    return `You are an expert technical interviewer with 15+ years of experience hiring for ${jobRole} positions at top tech companies.

**TASK:** Generate EXACTLY ${questionCount} interview questions that a real ${jobRole} interviewer would ask.

**CANDIDATE PROFILE:**
- Role: ${jobRole}
- Experience: ${experienceLevel}
- Key Skills: ${skills.join(', ')}
- Interview Type: ${interviewType}
- Difficulty: ${difficulty}

**CRITICAL REQUIREMENTS:**

1. **Question Quality Standards:**
   - Each question MUST be directly relevant to ${jobRole} work
   - Questions should test PRACTICAL skills, not just theory
   - Frame questions as real workplace scenarios when possible
   - Avoid generic questions that could apply to any role
   - Ensure questions match ${experienceLevel} experience level

2. **Experience-Based Difficulty Calibration:**
   ${this.getExperienceLevelGuidance(experienceLevel)}

3. **Question Type Distribution:**
   ${this.getQuestionTypeGuidance(interviewType, questionCount)}

4. **Question Characteristics:**
   - SPECIFIC: Reference actual technologies/frameworks (${skills.join(', ')})
   - REALISTIC: Questions commonly asked in real ${jobRole} interviews
   - ASSESSABLE: Candidate can demonstrate their knowledge clearly
   - BALANCED: Mix of conceptual and applied knowledge
   - TIME-APPROPRIATE: Answerable in ${this.getTimePerQuestion(questionCount)} minutes each

5. **Avoid These Pitfalls:**
   ❌ Generic questions like "Tell me about yourself"
   ❌ Yes/No questions that don't show depth
   ❌ Questions requiring access to specific codebases
   ❌ Overly complex multi-part questions
   ❌ Questions with outdated technology references

**OUTPUT FORMAT - STRICT JSON ONLY:**

You MUST return ONLY valid JSON with NO markdown, NO explanations, NO preamble:

{
  "questions": [
    {
      "id": 1,
      "type": "technical|behavioral|system-design|coding",
      "category": "Specific Category (e.g., React Hooks, System Design, Team Leadership)",
      "question": "The actual interview question - clear, specific, and relevant",
      "difficulty": "easy|medium|hard",
      "expectedDuration": "3-5 minutes",
      "hints": [
        "First hint to guide if candidate struggles",
        "Second hint for additional guidance"
      ],
      "evaluationCriteria": [
        "Key point 1 to look for in the answer",
        "Key point 2 to assess understanding",
        "Key point 3 for quality evaluation"
      ],
      "followUpPotential": "Brief note on potential follow-up directions"
    }
  ]
}

**EXAMPLE OF EXCELLENT QUESTION (React, Mid-level):**
{
  "id": 1,
  "type": "technical",
  "category": "React Performance",
  "question": "You notice your React application is re-rendering unnecessarily, causing performance issues. Walk me through how you would identify the cause and what techniques you'd use to optimize it.",
  "difficulty": "medium",
  "expectedDuration": "4-5 minutes",
  "hints": [
    "Consider React DevTools Profiler and what it shows",
    "Think about memoization techniques and when to use them"
  ],
  "evaluationCriteria": [
    "Mentions React DevTools Profiler or similar debugging approach",
    "Discusses React.memo, useMemo, or useCallback appropriately",
    "Understands when optimization is necessary vs premature",
    "Can explain the trade-offs of different optimization techniques"
  ],
  "followUpPotential": "Ask about specific scenario with Context API or prop drilling"
}

**VALIDATION CHECKLIST:**
Before returning, verify each question:
✓ Is it specific to ${jobRole} and ${skills.join(', ')}?
✓ Would a real interviewer ask this?
✓ Can the candidate demonstrate their expertise through this question?
✓ Does difficulty match ${experienceLevel} level?
✓ Are evaluation criteria clear and measurable?

Generate ${questionCount} questions NOW. Return ONLY the JSON object.`;
  }

  // Helper method for experience-level guidance
  getExperienceLevelGuidance(experienceLevel) {
    const guidance = {
      'junior': `**Junior Level (0-2 years):**
   - Focus on FUNDAMENTALS and core concepts
   - Test basic syntax, common patterns, and standard practices
   - Ask "What is..." and "How does..." questions
   - Include 1-2 simple problem-solving scenarios
   - Avoid complex system design or architectural questions
   - Example: "Explain the difference between let, const, and var in JavaScript"`,
      
      'mid': `**Mid-Level (2-5 years):**
   - Test DEEPER understanding and practical application
   - Include performance optimization and best practices
   - Ask about debugging, testing, and code review scenarios
   - Include 2-3 system design questions (component-level)
   - Test understanding of trade-offs and decision-making
   - Example: "How would you structure a React app with complex state management?"`,
      
      'senior': `**Senior Level (5+ years):**
   - Focus on ARCHITECTURE, scalability, and leadership
   - Include complex system design (application/infrastructure level)
   - Ask about technical decision-making and trade-offs
   - Include mentorship, code review, and team process questions
   - Test ability to explain complex concepts simply
   - Example: "Design a real-time notification system handling 1M+ concurrent users"`
    };
    
    return guidance[experienceLevel] || guidance['mid'];
  }

  // Helper method for question type distribution
  getQuestionTypeGuidance(interviewType, questionCount) {
    if (interviewType === 'technical') {
      return `Distribute questions across:
   - 40% Core Technical Concepts (fundamentals, APIs, patterns)
   - 30% Problem Solving (debugging, optimization, algorithms)
   - 20% System Design (architecture, scalability, trade-offs)
   - 10% Best Practices (code quality, testing, security)`;
    } else if (interviewType === 'behavioral') {
      return `Distribute questions across:
   - 40% STAR Format Situations (specific past experiences)
   - 30% Teamwork & Collaboration (conflict, communication)
   - 20% Leadership & Initiative (projects, mentoring, ownership)
   - 10% Cultural Fit (values, work style, motivation)`;
    } else { // mixed
      return `Distribute questions across:
   - 50% Technical (concepts, problem-solving, design)
   - 30% Behavioral (teamwork, leadership, communication)
   - 20% Hybrid (technical decisions, project management)`;
    }
  }

  // Helper method to calculate time per question
  getTimePerQuestion(questionCount) {
    if (questionCount <= 5) return '5-7';
    if (questionCount <= 8) return '4-5';
    if (questionCount <= 12) return '3-4';
    return '2-3';
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
        // Ensure all questions have IDs
        const questionsWithIds = parsed.questions.map((q, index) => ({
          ...q,
          id: q.id || (index + 1)
        }));
        return questionsWithIds.slice(0, expectedCount);
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
        difficulty: 'Easy',
        expectedDuration: '3-4 minutes',
        hints: ['Focus on relevant experience', 'Highlight key achievements'],
        evaluationCriteria: ['Communication skills', 'Relevant experience']
      },
      {
        id: 2,
        type: 'technical',
        category: 'Problem Solving',
        question: 'Describe a challenging technical problem you solved recently.',
        difficulty: 'Medium',
        expectedDuration: '4-5 minutes',
        hints: ['Explain your approach', 'Mention tools and technologies used'],
        evaluationCriteria: ['Problem-solving approach', 'Technical depth']
      },
      {
        id: 3,
        type: 'behavioral',
        category: 'Teamwork',
        question: 'How do you handle disagreements with team members?',
        difficulty: 'Medium',
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

      const response = await this.generateContentWithFallback(prompt);
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

      const response = await this.generateContentWithFallback(prompt);
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
      score: 5,
      strengths: ['Response recorded'],
      improvements: ['Detailed feedback unavailable due to service interruption'],
      technicalAccuracy: 'Unable to assess technical accuracy at this time',
      communication: 'Response received',
      suggestions: ['Review the core concepts of this topic'],
      overallFeedback: 'Your answer has been recorded. Detailed AI evaluation is currently unavailable.'
    };
  }

  /**
   * Evaluate all answers together for comprehensive feedback
   */
  async evaluateAllAnswers(questions, answers, interviewSetup) {
    try {
      if (!this.model) {
        return this.getBatchFallbackEvaluation(questions, answers);
      }

      const qaText = questions.map((q, idx) => {
        const answer = answers[idx];
        const questionId = q.id || q.questionId || q._id?.toString() || `question_${idx + 1}`;
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION ${idx + 1} [ID: ${questionId}]
Category: ${q.category || 'General'}
Difficulty: ${q.difficulty || 'Medium'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${q.question || q.questionText}

CANDIDATE'S ANSWER:
${answer?.answer || '[NO ANSWER PROVIDED]'}

Time Spent: ${answer?.timeSpent || 0} seconds
`;
      }).join('\n');

      const prompt = `You are a HIRING MANAGER reviewing a complete ${interviewSetup.interviewType} interview for a ${interviewSetup.jobRole} position.

INTERVIEW DETAILS:
- Role: ${interviewSetup.jobRole}
- Level: ${interviewSetup.experienceLevel}
- Skills: ${interviewSetup.skills.join(', ')}
- Questions: ${questions.length}

${qaText}

EVALUATION INSTRUCTIONS:

For EACH answer, check:
1. Is it gibberish/random text? → Score 0
2. Is it empty or "I don't know"? → Score 0-1
3. Is it completely wrong? → Score 1-2
4. Is it partially correct? → Score 3-5
5. Is it good and correct? → Score 6-8
6. Is it excellent? → Score 9-10

Score based on:
- Correctness (40%)
- Completeness (30%)
- Clarity (30%)

Score based on:
- Correctness (40%)
- Completeness (30%)
- Clarity (30%)

Return JSON with this exact format:

{
  "individualEvaluations": [
    {
      "questionId": "question_1",
      "score": 7.5,
      "technicalScore": 8,
      "communicationScore": 7,
      "strengths": ["what was good"],
      "improvements": ["what was missing"],
      "feedback": "2-3 sentences"
    }
  ],
  "overallScore": 7.2,
  "overallStrengths": ["strength 1", "strength 2"],
  "overallImprovements": ["improvement 1", "improvement 2"],
  "technicalAssessment": "2-3 sentences",
  "communicationAssessment": "2-3 sentences",
  "recommendation": "Yes/No/Maybe with 2 sentences why",
  "detailedFeedback": "3-4 sentences overall feedback"
}`;

      const response = await this.generateContentWithFallback(prompt);
      const text = response.text();

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const evaluation = JSON.parse(jsonMatch[0]);
          logger.info('Successfully evaluated all answers');
          return evaluation;
        }
      } catch (parseError) {
        logger.error('Error parsing batch evaluation response:', parseError);
      }

      return this.getBatchFallbackEvaluation(questions, answers);

    } catch (error) {
      logger.error('Error evaluating all answers:', error);
      return this.getBatchFallbackEvaluation(questions, answers);
    }
  }

  /**
   * Fallback batch evaluation
   */
  getBatchFallbackEvaluation(questions, answers) {
    const individualEvaluations = questions.map((q, idx) => {
      const answer = answers[idx];
      const answerText = answer?.answer ? answer.answer.trim() : '';
      const hasAnswer = answerText.length > 0;
      const questionId = q.id || q.questionId || q._id?.toString() || `question_${idx + 1}`;
      
      let score = 0;
      let feedback = 'No answer provided.';
      let strengths = [];
      let improvements = ['Answer was not provided'];

      if (hasAnswer) {
        const lowerAnswer = answerText.toLowerCase();
        const isDontKnow = lowerAnswer.includes("don't know") || 
                          lowerAnswer.includes("do not know") || 
                          lowerAnswer.includes("not sure") || 
                          lowerAnswer.includes("no idea") ||
                          lowerAnswer.includes("i don't know");
        
        if (isDontKnow) {
          score = 1;
          feedback = 'The candidate acknowledged they do not know the answer.';
          strengths = ['Honesty about knowledge gaps'];
          improvements = ['Review this topic', 'Study core concepts'];
        } else if (answerText.split(/\s+/).length < 5) {
          score = 2;
          feedback = 'The answer is too brief to fully evaluate.';
          strengths = ['Provided a response'];
          improvements = ['Elaborate on your answer', 'Provide examples'];
        } else {
          score = 5; // Neutral score when AI fails
          feedback = 'Answer recorded. Detailed AI evaluation was unavailable at this time.';
          strengths = ['Response recorded'];
          improvements = ['Detailed feedback unavailable'];
        }
      }
      
      return {
        questionId: questionId,
        score: score,
        technicalScore: score,
        communicationScore: score,
        strengths: strengths,
        improvements: improvements,
        feedback: feedback
      };
    });

    const averageScore = individualEvaluations.reduce((acc, curr) => acc + curr.score, 0) / (individualEvaluations.length || 1);

    return {
      individualEvaluations,
      overallScore: Math.round(averageScore * 10) / 10,
      overallStrengths: [
        'Completed the interview',
        'Attempted questions'
      ],
      overallImprovements: [
        'Review questions with low scores',
        'Practice technical explanations'
      ],
      technicalAssessment: 'Technical assessment limited due to service availability.',
      communicationAssessment: 'Communication assessment limited due to service availability.',
      recommendation: 'Please review individual answers.',
      detailedFeedback: 'Thank you for completing the interview. Some answers could not be fully evaluated by AI at this time.'
    };
  }

  /**
   * Generate questions using the architecture-specified prompt template
   * @param {Object} params - Question generation parameters
   * @returns {Promise<Array>} Array of generated questions in required format
   */
  async generateQuestionsArchitecture(params) {
    try {
      if (!this.model) {
        logger.warn('Gemini AI service not initialized, using fallback questions');
        return this.getArchitectureFallbackQuestions(params);
      }

      const { role, skills, experienceLevel } = params;
      
      // Add randomness to ensure different questions each time
      const randomSeed = Date.now();
      const sessionId = Math.random().toString(36).substring(7);

      // Architecture-specified Question Generation Prompt
      const prompt = `You are a professional technical interviewer conducting a NEW interview session (ID: ${sessionId}).
Generate 5–10 UNIQUE and VARIED fundamental technical interview questions based on:

Role: ${role}
Skills: ${skills.join(', ')}
Experience: ${experienceLevel}
Session Seed: ${randomSeed}

⚠️ CRITICAL: Generate DIFFERENT questions than previous sessions. Vary your approach, topics, and focus areas.

IMPORTANT GUIDELINES:
1. Focus on BASIC and FUNDAMENTAL concepts for each skill
2. Ask "What is", "How does", "Explain the concept of" type questions
3. DO NOT ask situational questions like "Tell me about a time when..." or "Describe your experience with..."
4. DO NOT ask "Where did you use..." or "Have you worked with..." type questions
5. Ask clear definition-based and concept-based questions
6. VARY the topics - cover different aspects of each skill
7. Examples of good questions:
   - "What is the virtual DOM in React?"
   - "What are hooks in React and why are they used?"
   - "Explain the difference between let, const, and var in JavaScript"
   - "What is closure in JavaScript?"
   - "How does async/await work in Node.js?"
8. Mix different topics: fundamentals, best practices, common pitfalls, comparisons

Adjust difficulty based on experience level:
- Junior: Very basic definitions and simple concepts
- Mid-level: Deeper concepts, comparisons, and practical applications
- Senior: Advanced concepts, design patterns, and architectural principles

Return ONLY valid JSON in this format:
{
  "questions": [
    { "questionText": "What are hooks in React?", "difficulty": "Easy", "category": "React Fundamentals" }
  ]
}`;

      const response = await this.generateContentWithFallback(prompt);
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in Gemini response, using fallback questions');
        return this.getArchitectureFallbackQuestions(params);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        logger.info(`Generated ${parsed.questions.length} questions using Gemini AI`);
        return parsed.questions;
      }

      logger.warn('Invalid question format from Gemini, using fallback questions');
      return this.getArchitectureFallbackQuestions(params);
    } catch (error) {
      logger.error('Error generating questions (architecture template):', error);
      logger.info('Using fallback questions due to Gemini API error');
      return this.getArchitectureFallbackQuestions(params);
    }
  }

  /**
   * Get fallback questions when Gemini AI is unavailable
   * @param {Object} params - Question parameters
   * @returns {Array} Array of fallback questions
   */
  getArchitectureFallbackQuestions(params) {
    const { role, skills, experienceLevel } = params;
    
    const primarySkill = skills[0] || 'JavaScript';
    const secondarySkill = skills[1] || 'programming';
    
    // Generate fundamental, concept-based questions with variations
    const questionPool = [
      {
        questionText: `What is ${primarySkill} and what are its core features?`,
        difficulty: 'Easy',
        category: 'Fundamentals'
      },
      {
        questionText: `Explain the main concepts and principles of ${primarySkill}.`,
        difficulty: 'Easy',
        category: 'Core Concepts'
      },
      {
        questionText: `What are the key advantages of using ${primarySkill} in modern development?`,
        difficulty: 'Easy',
        category: 'Fundamentals'
      },
      {
        questionText: `What are the key differences between ${primarySkill} and ${secondarySkill}?`,
        difficulty: 'Medium',
        category: 'Technical Comparison'
      },
      {
        questionText: `How does ${primarySkill} handle asynchronous operations?`,
        difficulty: 'Medium',
        category: 'Technical Knowledge'
      },
      {
        questionText: `What are the best practices for writing clean and maintainable code in ${primarySkill}?`,
        difficulty: 'Medium',
        category: 'Best Practices'
      },
      {
        questionText: `Explain the concept of data structures in ${primarySkill}. What types are commonly used?`,
        difficulty: experienceLevel === 'junior' ? 'Easy' : 'Medium',
        category: 'Data Structures'
      },
      {
        questionText: `What is error handling in ${primarySkill} and how is it implemented?`,
        difficulty: 'Easy',
        category: 'Error Handling'
      },
      {
        questionText: `What are design patterns? Name and explain a few common ones used in ${role} development.`,
        difficulty: experienceLevel === 'junior' ? 'Medium' : 'Hard',
        category: 'Design Patterns'
      },
      {
        questionText: `How would you optimize performance in a ${primarySkill} application?`,
        difficulty: experienceLevel === 'junior' ? 'Medium' : 'Hard',
        category: 'Performance'
      },
      {
        questionText: `What are common security considerations when working with ${primarySkill}?`,
        difficulty: 'Medium',
        category: 'Security'
      },
      {
        questionText: `Explain how you would debug issues in ${primarySkill} applications.`,
        difficulty: 'Easy',
        category: 'Debugging'
      }
    ];
    
    // Add skill-specific questions
    if (skills.includes('React') || skills.includes('react')) {
      questionPool.push(
        {
          questionText: 'What are hooks in React and why were they introduced?',
          difficulty: 'Easy',
          category: 'React Fundamentals'
        },
        {
          questionText: 'Explain the difference between state and props in React.',
          difficulty: 'Easy',
          category: 'React Fundamentals'
        },
        {
          questionText: 'What is the virtual DOM in React and how does it work?',
          difficulty: 'Medium',
          category: 'React Core Concepts'
        },
        {
          questionText: 'Explain the component lifecycle in React.',
          difficulty: 'Medium',
          category: 'React Advanced'
        }
      );
    }
    
    if (skills.includes('Node.js') || skills.includes('nodejs')) {
      questionPool.push(
        {
          questionText: 'What is Node.js and how does it differ from traditional web servers?',
          difficulty: 'Easy',
          category: 'Node.js Fundamentals'
        },
        {
          questionText: 'Explain the event loop in Node.js.',
          difficulty: 'Medium',
          category: 'Node.js Core Concepts'
        },
        {
          questionText: 'What are streams in Node.js and when would you use them?',
          difficulty: 'Medium',
          category: 'Node.js Advanced'
        }
      );
    }
    
    if (skills.includes('JavaScript') || skills.includes('javascript')) {
      questionPool.push(
        {
          questionText: 'What is closure in JavaScript and how is it used?',
          difficulty: 'Medium',
          category: 'JavaScript Core'
        },
        {
          questionText: 'Explain the difference between let, const, and var in JavaScript.',
          difficulty: 'Easy',
          category: 'JavaScript Fundamentals'
        },
        {
          questionText: 'What are promises in JavaScript and how do they work?',
          difficulty: 'Medium',
          category: 'JavaScript Async'
        }
      );
    }
    
    // Shuffle the question pool to add randomness
    const shuffled = questionPool.sort(() => Math.random() - 0.5);
    
    // Return 8 random questions from the pool
    return shuffled.slice(0, 8);
  }

  /**
   * Evaluate answer using the architecture-specified prompt template
   * @param {Object} params - Evaluation parameters
   * @returns {Promise<Object>} Evaluation result in required format
   */
  async evaluateAnswerArchitecture(params) {
    try {
      if (!this.model) {
        throw new Error('Gemini AI service not initialized');
      }

      const { question, answer, questionContext } = params;

      // Simple prompt - let Gemini evaluate naturally
      const prompt = `You are a technical interviewer. Evaluate this interview answer and provide a score from 0-10.

Question: ${question}

Answer: ${answer || '[NO ANSWER PROVIDED]'}

Provide your evaluation as JSON:
{
  "score": 7.5,
  "maxScore": 10,
  "technicalScore": 8,
  "communicationScore": 7,
  "quality": "Good",
  "feedback": "Your feedback here",
  "missingPoints": ["point 1", "point 2"],
  "improvementTip": "Your tip here"
}

Quality must be: "Excellent" (9-10), "Good" (7-8.9), "Average" (5-6.9), "Below Average" (3-4.9), or "Poor" (0-2.9)
Technical Score: 0-10 based on technical accuracy and depth.
Communication Score: 0-10 based on clarity, structure, and conciseness.`;

      const response = await this.generateContentWithFallback(prompt);
      let text = response.text().trim();

      // Clean up response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in Gemini response:', text.substring(0, 200));
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the score
      let score = parseFloat(parsed.score);
      if (isNaN(score) || score < 0) {
        score = 0;
      } else if (score > 10) {
        score = 10;
      }

      // Validate and normalize quality
      const validQualities = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'];
      let quality = parsed.quality || this.getQualityFromScore(score);
      
      // Handle variations in quality strings
      if (!validQualities.includes(quality)) {
        // Try to map common variations
        const qualityLower = quality.toLowerCase();
        if (qualityLower.includes('excellent') || qualityLower.includes('outstanding')) {
          quality = 'Excellent';
        } else if (qualityLower.includes('good') || qualityLower.includes('strong')) {
          quality = 'Good';
        } else if (qualityLower.includes('average') || qualityLower.includes('fair')) {
          quality = 'Average';
        } else if (qualityLower.includes('below') || qualityLower.includes('weak')) {
          quality = 'Below Average';
        } else if (qualityLower.includes('poor') || qualityLower.includes('inadequate')) {
          quality = 'Poor';
        } else {
          // Default to quality based on score
          quality = this.getQualityFromScore(score);
        }
      }

      // Ensure all required fields are present and valid
      const evaluation = {
        score: Math.round(score * 10) / 10, // Round to 1 decimal place
        maxScore: 10,
        technicalScore: parsed.technicalScore !== undefined ? Math.round(parseFloat(parsed.technicalScore) * 10) / 10 : Math.round(score * 10) / 10,
        communicationScore: parsed.communicationScore !== undefined ? Math.round(parseFloat(parsed.communicationScore) * 10) / 10 : Math.round(score * 10) / 10,
        quality: quality,
        feedback: parsed.feedback || 'Answer received and evaluated.',
        missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
        improvementTip: parsed.improvementTip || 'Keep practicing to improve your interview skills.'
      };

      logger.info(`Answer evaluated: Score ${evaluation.score}/10, Quality: ${evaluation.quality}`);
      return evaluation;

    } catch (error) {
      logger.error('Error evaluating answer (architecture template):', error);
      
      // Return a minimal evaluation on error
      return {
        score: 5,
        maxScore: 10,
        technicalScore: 5,
        communicationScore: 5,
        quality: 'Average',
        feedback: 'I received your answer, but I am unable to provide a detailed evaluation at this moment due to a service interruption. Please continue to the next question.',
        missingPoints: ['Detailed feedback unavailable'],
        improvementTip: 'Review this topic later.'
      };
    }
  }

  /**
   * Helper method to determine quality rating from score
   * @param {number} score - Score value (0-10)
   * @returns {string} Quality rating
   */
  getQualityFromScore(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Average';
    if (score >= 3) return 'Below Average';
    return 'Poor';
  }
}

module.exports = new GeminiService();