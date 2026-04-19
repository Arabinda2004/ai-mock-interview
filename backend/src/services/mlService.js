const logger = require('../utils/logger');
const QuestionTemplate = require('../models/QuestionTemplate');

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i',
    'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'so', 'the', 'their', 'them',
    'there', 'these', 'they', 'this', 'those', 'to', 'was', 'we', 'what', 'when', 'where', 'which',
    'who', 'why', 'with', 'would', 'you', 'your'
]);

const GENERIC_QUESTION_TOKENS = new Set([
    'between', 'common', 'core', 'different', 'difference', 'explain', 'important', 'most', 'real', 'should',
    'useful', 'works', 'project', 'projects', 'system', 'systems'
]);

class MLService {
    constructor() {
        this.baseUrl = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
        this.timeoutMs = parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 7000;
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
            return this.getFallbackSingleEvaluation(question, answer, expectedConcepts);
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
            return this.getFallbackSingleEvaluation(question, answer, expectedConcepts);
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
            const quality = this.normalizeQuality(item.quality, score);
            const missingPoints = Array.isArray(item.missingPoints)
                ? item.missingPoints
                : Array.isArray(item.missingConcepts)
                    ? item.missingConcepts
                    : Array.isArray(item.improvements)
                        ? item.improvements
                        : [];

            return {
                questionId,
                score: this.round1(score),
                technicalScore: this.round1(technicalScore),
                communicationScore: this.round1(communicationScore),
                quality,
                strengths: Array.isArray(item.strengths) ? item.strengths : [],
                improvements: Array.isArray(item.improvements) ? item.improvements : [],
                missingPoints,
                feedback: item.feedback || 'Answer evaluated.',
                improvementTip: item.improvementTip || this.defaultImprovementTip(quality)
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

            const expectedConcepts = Array.isArray(question.expectedConcepts)
                ? question.expectedConcepts
                : [];

            const single = this.getFallbackSingleEvaluation(
                question.question || question.questionText || '',
                text,
                expectedConcepts
            );

            return {
                questionId,
                score: single.score,
                technicalScore: single.technicalScore,
                communicationScore: single.communicationScore,
                quality: single.quality,
                strengths: text ? ['Provided an answer'] : [],
                improvements: single.missingPoints,
                missingPoints: single.missingPoints,
                feedback: single.feedback,
                improvementTip: single.improvementTip
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

    getFallbackSingleEvaluation(question, answer, expectedConcepts = []) {
        const cleanQuestion = this.normalizeText(question || '');
        const cleanAnswer = this.normalizeText(answer || '');

        const normalizedExpectedConcepts = Array.isArray(expectedConcepts)
            ? expectedConcepts.map((concept) => this.normalizeText(concept)).filter(Boolean)
            : [];

        const resolvedExpectedConcepts = normalizedExpectedConcepts.length > 0
            ? normalizedExpectedConcepts
            : this.extractExpectedConceptsFromQuestion(cleanQuestion);

        if (!cleanAnswer) {
            return {
                score: 0,
                maxScore: 10,
                technicalScore: 0,
                communicationScore: 0,
                quality: 'Poor',
                feedback: 'No answer was provided.',
                missingPoints: resolvedExpectedConcepts.length > 0
                    ? resolvedExpectedConcepts.slice(0, 5)
                    : ['Provide an answer relevant to the question'],
                improvementTip: 'Start with a clear definition, then include one concrete example.'
            };
        }

        const conceptCoverage = this.getConceptCoverage(resolvedExpectedConcepts, cleanAnswer);
        const heuristicScores = this.computeHeuristicFallbackScores(
            cleanQuestion,
            cleanAnswer,
            resolvedExpectedConcepts,
            conceptCoverage
        );

        const quality = this.normalizeQuality(null, heuristicScores.score);
        const feedback = this.buildFallbackFeedback(quality, conceptCoverage.missing);
        const missingPoints = conceptCoverage.missing.slice(0, 5);

        return {
            score: this.round1(heuristicScores.score),
            maxScore: 10,
            technicalScore: this.round1(heuristicScores.technicalScore),
            communicationScore: this.round1(heuristicScores.communicationScore),
            quality,
            feedback,
            missingPoints,
            improvementTip: this.defaultImprovementTip(quality)
        };
    }

    normalizeText(text = '') {
        return String(text).replace(/\s+/g, ' ').trim();
    }

    tokenizeText(text = '', keepStopWords = false) {
        const normalized = this.normalizeText(text).toLowerCase();
        const rawTokens = normalized
            .split(/[^a-z0-9+#.]+/)
            .filter((token) => token.length > 1);

        if (keepStopWords) {
            return rawTokens;
        }

        return rawTokens.filter((token) => token.length > 2 && !STOP_WORDS.has(token));
    }

    extractExpectedConceptsFromQuestion(question = '') {
        const questionLower = this.normalizeText(question).toLowerCase();
        const inferred = [];

        const comparisonMatch = questionLower.match(
            /(?:difference|compare|comparison)\s+between\s+([a-z0-9+#.\-]+)\s+and\s+([a-z0-9+#.\-]+)/
        );
        if (comparisonMatch) {
            comparisonMatch.slice(1).forEach((candidate) => {
                const normalized = this.normalizeText(candidate);
                if (normalized && !inferred.includes(normalized)) {
                    inferred.push(normalized);
                }
            });
        }

        const patternCandidates = [
            /what is ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)/,
            /explain ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)/,
            /define ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)/
        ];

        for (const pattern of patternCandidates) {
            const match = questionLower.match(pattern);
            if (!match) continue;

            const candidate = this.normalizeText(match[1]);
            if (!candidate) break;

            const candidateTokens = this.tokenizeText(candidate)
                .filter((token) => !GENERIC_QUESTION_TOKENS.has(token));

            if (candidateTokens.length > 0) {
                candidateTokens.slice(0, 3).forEach((token) => {
                    if (!inferred.includes(token)) {
                        inferred.push(token);
                    }
                });
            } else if (!inferred.includes(candidate)) {
                inferred.push(candidate);
            }
            break;
        }

        for (const token of this.tokenizeText(questionLower)) {
            if (GENERIC_QUESTION_TOKENS.has(token)) continue;

            if (!inferred.includes(token)) {
                inferred.push(token);
            }

            if (inferred.length >= 5) break;
        }

        return inferred;
    }

    conceptMatchesAnswer(concept, answerLower, answerTokenSet) {
        const normalizeToken = (token) => {
            if (!token) return token;

            if (token.endsWith('ies') && token.length > 4) {
                return `${token.slice(0, -3)}y`;
            }
            if (token.endsWith('es') && token.length > 4) {
                return token.slice(0, -2);
            }
            if (token.endsWith('s') && token.length > 3) {
                return token.slice(0, -1);
            }

            return token;
        };

        const conceptLower = this.normalizeText(concept).toLowerCase();
        if (!conceptLower) {
            return false;
        }

        if (answerLower.includes(conceptLower)) {
            return true;
        }

        const conceptTokensForContains = this.tokenizeText(conceptLower, true).map(normalizeToken);
        if (conceptTokensForContains.some((token) => token && answerLower.includes(token))) {
            return true;
        }

        const normalizedAnswerTokenSet = new Set([...answerTokenSet].map((token) => normalizeToken(token)));

        let conceptTokens = this.tokenizeText(conceptLower, true);
        const filtered = conceptTokens.filter((token) => !STOP_WORDS.has(token));
        if (filtered.length > 0) {
            conceptTokens = filtered;
        }

        if (conceptTokens.length === 0) {
            return false;
        }

        const uniqueConceptTokens = [...new Set(conceptTokens.map((token) => normalizeToken(token)))];
        const overlap = uniqueConceptTokens.filter((token) => normalizedAnswerTokenSet.has(token)).length;
        const requiredOverlap = Math.max(1, Math.floor((uniqueConceptTokens.length + 1) / 2));

        return overlap >= requiredOverlap;
    }

    getConceptCoverage(expectedConcepts, answerText) {
        const answerLower = String(answerText).toLowerCase();
        const answerTokenSet = new Set(this.tokenizeText(answerText, true));
        const present = [];
        const missing = [];

        (expectedConcepts || []).forEach((concept) => {
            const conceptClean = this.normalizeText(concept);
            if (!conceptClean) return;

            if (this.conceptMatchesAnswer(conceptClean, answerLower, answerTokenSet)) {
                present.push(conceptClean);
            } else {
                missing.push(conceptClean);
            }
        });

        return { present, missing };
    }

    computeHeuristicFallbackScores(questionText, answerText, expectedConcepts, conceptCoverage) {
        const answerTokens = this.tokenizeText(answerText);
        const questionTokens = this
            .tokenizeText(questionText)
            .filter((token) => !GENERIC_QUESTION_TOKENS.has(token));

        const answerTokenSet = new Set(answerTokens);
        const uniqueQuestionTokens = [...new Set(questionTokens)];
        const overlapCount = uniqueQuestionTokens.filter((token) => answerTokenSet.has(token)).length;
        let relevance = uniqueQuestionTokens.length > 0 ? overlapCount / uniqueQuestionTokens.length : 0;

        const wordCount = answerTokens.length;
        const minOverlapForFloor = uniqueQuestionTokens.length <= 2 ? 1 : 2;
        if (wordCount >= 35 && overlapCount >= minOverlapForFloor) {
            relevance = Math.max(relevance, 0.45);
        }

        const conceptRatio = expectedConcepts.length > 0
            ? conceptCoverage.present.length / expectedConcepts.length
            : Math.max(relevance, Math.min(wordCount / 120, 0.35));

        const lengthFactor = Math.min(wordCount / 90, 1.0);
        const shortAnswerFactor = wordCount < 8 ? 0.35 : (wordCount < 15 ? 0.60 : (wordCount < 25 ? 0.90 : 1.0));

        let technicalScore = 2.5 + (4.5 * conceptRatio) + (2.0 * relevance) + (1.0 * lengthFactor);
        if (conceptRatio === 0 && relevance < 0.15) {
            technicalScore *= 0.45;
        }

        technicalScore *= shortAnswerFactor;

        const sentenceCount = answerText
            .split(/[.!?]+/)
            .map((part) => part.trim())
            .filter(Boolean)
            .length;

        let communicationScore = 3.0 + (5.0 * Math.min(wordCount / 80, 1.0)) + (3.0 * Math.min(sentenceCount / 5, 1.0));
        communicationScore *= shortAnswerFactor;

        if (wordCount >= 40 && conceptRatio >= 0.5) {
            technicalScore += 0.4;
            communicationScore += 0.2;
        }

        if (conceptCoverage.present.length >= 2 && wordCount >= 25) {
            technicalScore += 0.3;
        }

        technicalScore = this.clampRange(technicalScore, 0, 10);
        communicationScore = this.clampRange(communicationScore, 0, 10);
        const score = this.clampRange((0.78 * technicalScore) + (0.22 * communicationScore), 0, 10);

        return {
            score,
            technicalScore,
            communicationScore
        };
    }

    buildFallbackFeedback(quality, missingConcepts = []) {
        let feedback;

        if (quality === 'Excellent') {
            feedback = 'Strong answer with clear technical depth and communication.';
        } else if (quality === 'Good') {
            feedback = 'Good answer. Add one more edge case or trade-off for a stronger response.';
        } else if (quality === 'Average') {
            feedback = 'Your answer is partially correct but needs better concept coverage.';
        } else if (quality === 'Below Average') {
            feedback = 'Your answer misses important concepts expected for this interview question.';
        } else {
            feedback = 'The answer is weak or incomplete for the asked question.';
        }

        if (Array.isArray(missingConcepts) && missingConcepts.length > 0) {
            feedback += ` Missing concepts: ${missingConcepts.slice(0, 3).join(', ')}.`;
        }

        return feedback;
    }

    clampRange(value, min, max) {
        return Math.max(min, Math.min(max, value));
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
