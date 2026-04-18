const logger = require('../utils/logger');
const QuestionTemplate = require('../models/QuestionTemplate');

class MLService {
    constructor() {
        this.baseUrl = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
        this.timeoutMs = parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 3500;
        this.modelName = process.env.ML_MODEL_NAME || 'deberta-v3-base';
        this.enabled = process.env.ML_SERVICE_ENABLED !== 'false';

        logger.info(
            `ML service configured. enabled=${this.enabled}, url=${this.baseUrl}, model=${this.modelName}`
        );
    }

    /**
     * Lightweight status for health endpoint usage.
     */
    async getStatus() {
        if (!this.enabled) {
            return {
                status: 'disabled',
                model: this.modelName,
                url: this.baseUrl
            };
        }

        try {
            const response = await this.request('/health', null, {
                method: 'GET',
                timeoutMs: 1200
            });

            return {
                status: 'available',
                model: response?.model || this.modelName,
                url: this.baseUrl,
                details: response
            };
        } catch (error) {
            return {
                status: 'unavailable',
                model: this.modelName,
                url: this.baseUrl,
                error: error.message
            };
        }
    }

    /**
     * Primary adapter for question generation.
     * Uses question templates from MongoDB first, then deterministic fallbacks.
     */
    async generateQuestionsArchitecture(params = {}) {
        const targetCount = this.getQuestionCount(params.duration, params.interviewType);

        try {
            const templates = await this.fetchQuestionTemplates(params, targetCount);
            if (templates.length > 0) {
                logger.info(`Generated ${templates.length} questions from question template bank`);
                return templates;
            }

            logger.warn('No question templates found. Using deterministic fallback questions.');
            return this.getArchitectureFallbackQuestions(params, targetCount);
        } catch (error) {
            logger.error('Error generating questions from template bank:', error);
            return this.getArchitectureFallbackQuestions(params, targetCount);
        }
    }

    async fetchQuestionTemplates(params, targetCount) {
        const role = (params.role || '').trim();
        const skills = Array.isArray(params.skills) ? params.skills : [];
        const mappedDifficulty = this.mapDifficultyFromExperience(params.experienceLevel);

        const match = {
            isActive: true
        };

        if (role) {
            match.$or = [
                { jobRole: role },
                { skills: { $in: skills } }
            ];
        } else {
            match.skills = { $in: skills };
        }

        if (mappedDifficulty) {
            match.difficulty = mappedDifficulty;
        }

        const sampled = await QuestionTemplate.aggregate([
            { $match: match },
            { $sample: { size: targetCount } }
        ]);

        return sampled.map((template, index) => ({
            questionText: template.question,
            difficulty: template.difficulty || 'Medium',
            category: template.category || 'General',
            expectedConcepts: this.extractExpectedConcepts(template),
            questionNumber: index + 1
        }));
    }

    extractExpectedConcepts(template) {
        if (Array.isArray(template.evaluationCriteria) && template.evaluationCriteria.length > 0) {
            return template.evaluationCriteria.slice(0, 5);
        }

        if (Array.isArray(template.tags) && template.tags.length > 0) {
            return template.tags.slice(0, 5);
        }

        return [];
    }

    getQuestionCount(duration, interviewType) {
        if (!duration) {
            return interviewType === 'mixed' ? 8 : 6;
        }

        let baseQuestions;
        if (duration <= 15) baseQuestions = 5;
        else if (duration <= 30) baseQuestions = 8;
        else if (duration <= 60) baseQuestions = 12;
        else baseQuestions = 16;

        return interviewType === 'mixed' ? Math.max(6, baseQuestions) : Math.max(5, baseQuestions);
    }

    mapDifficultyFromExperience(experienceLevel = '') {
        const normalized = experienceLevel.toLowerCase();

        if (normalized.includes('junior') || normalized.includes('entry')) return 'Easy';
        if (normalized.includes('senior') || normalized.includes('lead') || normalized.includes('expert')) return 'Hard';

        return 'Medium';
    }

    getArchitectureFallbackQuestions(params = {}, targetCount = 8) {
        const role = params.role || 'Software Engineer';
        const skills = Array.isArray(params.skills) && params.skills.length > 0 ? params.skills : ['JavaScript'];
        const primarySkill = skills[0];
        const secondarySkill = skills[1] || 'software development';

        const pool = [
            {
                questionText: `What is ${primarySkill} and where is it most useful in real projects?`,
                difficulty: 'Easy',
                category: 'Fundamentals',
                expectedConcepts: [primarySkill, 'core features', 'use cases']
            },
            {
                questionText: `Explain the key concepts behind ${primarySkill} in your own words.`,
                difficulty: 'Easy',
                category: 'Concepts',
                expectedConcepts: [primarySkill, 'concept clarity', 'terminology']
            },
            {
                questionText: `What are common mistakes engineers make when using ${primarySkill}?`,
                difficulty: 'Medium',
                category: 'Best Practices',
                expectedConcepts: ['pitfalls', 'best practices', 'debugging']
            },
            {
                questionText: `Compare ${primarySkill} with ${secondarySkill}. When would you choose one over the other?`,
                difficulty: 'Medium',
                category: 'Comparisons',
                expectedConcepts: ['trade-offs', 'decision making', 'architecture']
            },
            {
                questionText: `How would you improve performance in a ${primarySkill}-based system?`,
                difficulty: 'Hard',
                category: 'Performance',
                expectedConcepts: ['profiling', 'optimization', 'bottlenecks']
            },
            {
                questionText: `What security concerns should you consider when building ${role} solutions?`,
                difficulty: 'Medium',
                category: 'Security',
                expectedConcepts: ['security risks', 'validation', 'auth']
            },
            {
                questionText: `How do you test and validate code quality in ${primarySkill} projects?`,
                difficulty: 'Medium',
                category: 'Testing',
                expectedConcepts: ['unit testing', 'integration testing', 'quality checks']
            },
            {
                questionText: `Describe how you would troubleshoot a production issue in a ${primarySkill} application.`,
                difficulty: 'Hard',
                category: 'Debugging',
                expectedConcepts: ['logs', 'reproduction', 'root cause']
            }
        ];

        // Keep output stable but not fixed order.
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, targetCount);
    }

    /**
     * Primary adapter for single-answer evaluation.
     */
    async evaluateAnswerArchitecture(params = {}) {
        const question = params.question || '';
        const answer = params.answer || '';
        const expectedConcepts = Array.isArray(params.questionContext?.expectedConcepts)
            ? params.questionContext.expectedConcepts
            : [];

        if (!this.enabled) {
            return this.getFallbackSingleEvaluation(question, answer);
        }

        try {
            const raw = await this.request('/evaluate', {
                question,
                answer,
                expectedConcepts
            });

            return this.normalizeSingleEvaluation(raw);
        } catch (error) {
            logger.error('ML service /evaluate failed. Falling back to local scoring:', error.message);
            return this.getFallbackSingleEvaluation(question, answer);
        }
    }

    normalizeSingleEvaluation(raw = {}) {
        const score = this.clampNumber(raw.score, 0, 10, 5);
        const technicalScore = this.clampNumber(raw.technicalScore, 0, 10, score);
        const communicationScore = this.clampNumber(raw.communicationScore, 0, 10, score);
        const quality = this.normalizeQuality(raw.quality, score);

        const missingPoints = Array.isArray(raw.missingPoints)
            ? raw.missingPoints
            : Array.isArray(raw.missingConcepts)
                ? raw.missingConcepts
                : [];

        return {
            score: this.round1(score),
            maxScore: 10,
            technicalScore: this.round1(technicalScore),
            communicationScore: this.round1(communicationScore),
            quality,
            feedback: raw.feedback || 'Answer evaluated successfully.',
            missingPoints,
            improvementTip: raw.improvementTip || this.defaultImprovementTip(quality)
        };
    }

    /**
     * Primary adapter for batch interview evaluation.
     */
    async evaluateAllAnswers(questions = [], answers = [], interviewSetup = {}) {
        if (!Array.isArray(questions) || questions.length === 0) {
            return this.getBatchFallbackEvaluation([], []);
        }

        if (this.enabled) {
            try {
                const raw = await this.request('/evaluate-batch', {
                    questions,
                    answers,
                    interviewSetup
                });

                return this.normalizeBatchEvaluation(raw, questions, answers);
            } catch (error) {
                logger.error('ML service /evaluate-batch failed. Falling back to local batch scoring:', error.message);
            }
        }

        return this.getBatchFallbackEvaluation(questions, answers);
    }

    normalizeBatchEvaluation(raw = {}, questions = [], answers = []) {
        const fallback = this.getBatchFallbackEvaluation(questions, answers);

        if (!Array.isArray(raw.individualEvaluations)) {
            return fallback;
        }

        const individualEvaluations = raw.individualEvaluations.map((item, index) => {
            const question = questions[index] || {};
            const answer = answers[index] || {};
            const questionId =
                item.questionId ||
                question.questionId ||
                question.id ||
                answer.questionId ||
                `question_${index + 1}`;

            const score = this.clampNumber(item.score, 0, 10, 5);
            const technicalScore = this.clampNumber(item.technicalScore, 0, 10, score);
            const communicationScore = this.clampNumber(item.communicationScore, 0, 10, score);

            return {
                questionId,
                score: this.round1(score),
                technicalScore: this.round1(technicalScore),
                communicationScore: this.round1(communicationScore),
                strengths: Array.isArray(item.strengths) ? item.strengths : [],
                improvements: Array.isArray(item.improvements) ? item.improvements : [],
                feedback: item.feedback || 'Answer evaluated.'
            };
        });

        const averageScore =
            individualEvaluations.reduce((sum, item) => sum + item.score, 0) /
            (individualEvaluations.length || 1);

        const avgTechnical =
            individualEvaluations.reduce((sum, item) => sum + item.technicalScore, 0) /
            (individualEvaluations.length || 1);

        const avgCommunication =
            individualEvaluations.reduce((sum, item) => sum + item.communicationScore, 0) /
            (individualEvaluations.length || 1);

        return {
            individualEvaluations,
            overallScore: this.round1(this.clampNumber(raw.overallScore, 0, 10, averageScore)),
            technicalScore: this.round1(this.clampNumber(raw.technicalScore, 0, 10, avgTechnical)),
            communicationScore: this.round1(this.clampNumber(raw.communicationScore, 0, 10, avgCommunication)),
            confidenceScore: this.round1(this.clampNumber(raw.confidenceScore, 0, 10, averageScore)),
            overallStrengths: Array.isArray(raw.overallStrengths) ? raw.overallStrengths : fallback.overallStrengths,
            overallImprovements: Array.isArray(raw.overallImprovements) ? raw.overallImprovements : fallback.overallImprovements,
            technicalAssessment: raw.technicalAssessment || fallback.technicalAssessment,
            communicationAssessment: raw.communicationAssessment || fallback.communicationAssessment,
            recommendation: raw.recommendation || fallback.recommendation,
            detailedFeedback: raw.detailedFeedback || fallback.detailedFeedback
        };
    }

    getBatchFallbackEvaluation(questions = [], answers = []) {
        const individualEvaluations = questions.map((question, index) => {
            const answerItem = answers[index] || {};
            const text = (answerItem.answer || '').trim();
            const questionId =
                question.questionId ||
                question.id ||
                answerItem.questionId ||
                `question_${index + 1}`;

            const single = this.getFallbackSingleEvaluation(question.question || question.questionText || '', text);

            return {
                questionId,
                score: single.score,
                technicalScore: single.technicalScore,
                communicationScore: single.communicationScore,
                strengths: text ? ['Provided an answer'] : [],
                improvements: single.missingPoints,
                feedback: single.feedback
            };
        });

        const averageScore =
            individualEvaluations.reduce((sum, item) => sum + item.score, 0) /
            (individualEvaluations.length || 1);

        return {
            individualEvaluations,
            overallScore: this.round1(averageScore),
            technicalScore: this.round1(averageScore),
            communicationScore: this.round1(averageScore),
            confidenceScore: this.round1(averageScore),
            overallStrengths: ['Completed interview flow', 'Responses were captured successfully'],
            overallImprovements: ['Add more technical depth', 'Use structured answers with examples'],
            technicalAssessment: 'Technical depth varies across answers. Focus on concept accuracy and examples.',
            communicationAssessment: 'Answer clarity is acceptable, but structure can be improved for interview settings.',
            recommendation: 'Continue practice with focus on depth, correctness, and concise communication.',
            detailedFeedback: 'Interview responses were processed with fallback scoring. Review low-scoring areas and practice again.'
        };
    }

    getFallbackSingleEvaluation(question, answer) {
        const text = (answer || '').trim();
        const wordCount = text ? text.split(/\s+/).length : 0;

        let score = 0;
        let feedback = 'No answer provided.';
        let missingPoints = ['Provide an answer relevant to the question'];

        if (!text) {
            score = 0;
            feedback = 'No answer was provided.';
        } else if (this.looksIrrelevant(question, text)) {
            score = 2;
            feedback = 'Your answer appears to be weakly related to the question.';
            missingPoints = ['Address the exact topic asked', 'Use correct technical terminology'];
        } else if (wordCount < 8) {
            score = 3.5;
            feedback = 'Your answer is too brief for reliable evaluation.';
            missingPoints = ['Add definition or explanation', 'Include a practical example'];
        } else if (wordCount < 25) {
            score = 5.5;
            feedback = 'Your answer covers some points but needs more depth.';
            missingPoints = ['Explain why the concept matters', 'Add implementation details'];
        } else {
            score = 7;
            feedback = 'Your answer is reasonably detailed. Improve precision and completeness for higher scores.';
            missingPoints = ['Include edge cases', 'Mention trade-offs clearly'];
        }

        const quality = this.normalizeQuality(null, score);

        return {
            score: this.round1(score),
            maxScore: 10,
            technicalScore: this.round1(score),
            communicationScore: this.round1(Math.min(10, score + 0.3)),
            quality,
            feedback,
            missingPoints,
            improvementTip: this.defaultImprovementTip(quality)
        };
    }

    looksIrrelevant(question, answer) {
        const questionTokens = (question || '')
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((token) => token.length > 3);

        const answerLower = (answer || '').toLowerCase();
        const overlap = questionTokens.filter((token) => answerLower.includes(token)).length;

        return questionTokens.length > 0 && overlap === 0;
    }

    async generateFollowUpQuestion(context = {}) {
        if (this.enabled) {
            try {
                const response = await this.request('/follow-up', {
                    originalQuestion: context.originalQuestion || '',
                    previousAnswer: context.previousAnswer || ''
                });

                if (response?.question && typeof response.question === 'string') {
                    return response.question.trim();
                }
            } catch (error) {
                logger.warn(`ML service /follow-up unavailable: ${error.message}`);
            }
        }

        return this.getFallbackFollowUpQuestion(context);
    }

    getFallbackFollowUpQuestion(context = {}) {
        const answer = (context.previousAnswer || '').trim();

        if (!answer) {
            return 'Can you start by defining the core concept behind your previous answer?';
        }

        if (answer.split(/\s+/).length < 12) {
            return 'Could you expand your previous response with a concrete real-world example?';
        }

        return 'What trade-offs or edge cases should an interviewer consider for the approach you described?';
    }

    normalizeQuality(quality, score) {
        const validQualities = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'];

        if (quality && validQualities.includes(quality)) {
            return quality;
        }

        if (score >= 9) return 'Excellent';
        if (score >= 7) return 'Good';
        if (score >= 5) return 'Average';
        if (score >= 3) return 'Below Average';
        return 'Poor';
    }

    defaultImprovementTip(quality) {
        switch (quality) {
            case 'Excellent':
                return 'Great answer. Keep the same structure and add concise examples for consistency.';
            case 'Good':
                return 'Add one more technical detail or edge case to push this answer higher.';
            case 'Average':
                return 'Structure your answer as definition, example, and trade-off for better clarity.';
            case 'Below Average':
                return 'Review core concepts first, then practice explaining them with short examples.';
            default:
                return 'Revisit the topic fundamentals and practice with guided sample answers.';
        }
    }

    clampNumber(value, min, max, fallback) {
        const parsed = parseFloat(value);
        if (Number.isNaN(parsed)) {
            return fallback;
        }

        if (parsed < min) return min;
        if (parsed > max) return max;
        return parsed;
    }

    round1(value) {
        return Math.round(value * 10) / 10;
    }

    async request(path, payload, options = {}) {
        const method = options.method || 'POST';
        const timeoutMs = options.timeoutMs || this.timeoutMs;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const requestOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            };

            if (payload !== null && payload !== undefined && method !== 'GET') {
                requestOptions.body = JSON.stringify(payload);
            }

            const response = await fetch(`${this.baseUrl}${path}`, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }
}

module.exports = new MLService();
