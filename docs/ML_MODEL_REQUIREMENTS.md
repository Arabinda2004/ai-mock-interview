# ML Model Requirements for Replacing Gemini API

## 1. Purpose

This document defines the project requirements for replacing the current Gemini API integration with a proper trainable ML model so you can demonstrate:

- measurable accuracy
- reproducible training/testing
- model behavior quality
- objective evaluation results to your guide

Scope: backend AI components for question generation and answer evaluation in `d:\Arabinda\AI Inv PR2`.

## 2. Current System Requirements Derived from Codebase

The replacement model must satisfy these existing product and API contracts.

### 2.1 Existing AI Responsibilities

1. Generate interview questions from role, skills, and experience level.
2. Evaluate a single answer (score + feedback + missing points + improvement tip).
3. Evaluate all answers together at interview submission (overall score + per-question scoring + strengths/improvements + recommendation).
4. Optionally generate follow-up questions.

### 2.2 Existing Output Contracts You Must Preserve

The model/service output must remain compatible with current backend/frontend usage:

1. Per-answer evaluation (`0-10` scale internally):

- `score`
- `maxScore` (currently 10)
- `technicalScore`
- `communicationScore`
- `quality` in: `Excellent | Good | Average | Below Average | Poor`
- `feedback`
- `missingPoints[]`
- `improvementTip`

2. Interview-level output:

- `overallScore`
- `individualEvaluations[]`
- `overallStrengths[]`
- `overallImprovements[]`
- `technicalAssessment`
- `communicationAssessment`
- `recommendation`
- `detailedFeedback`

3. Results UI expects percentage style fields (`0-100`) after backend conversion.

### 2.3 Existing Data Entities Relevant for ML

1. `Interview` collection:

- role, experience level, skills targeted, duration, status, results

2. `Question` collection:

- question text, category, difficulty, number, interview link

3. `Answer` collection:

- user answer text, answer time, AI review object (score and feedback fields)

## 3. Functional Requirements for the New ML System

### FR-1 Question Generation

1. Input:

- job role
- skills array
- experience level
- interview type/difficulty (if available)

2. Output:

- list of interview questions with category and difficulty
- JSON format compatible with current route/controller expectations

3. Behavior:

- role/skill-specific questions
- varied but relevant questions
- level-aware difficulty (junior/mid/senior)

### FR-2 Single Answer Evaluation

1. Input:

- question text
- user answer text

2. Output (required):

- numeric score (`0-10`)
- technical score (`0-10`)
- communication score (`0-10`)
- quality class label
- textual feedback + missing points + improvement tip

3. Behavior:

- penalize incorrect/gibberish/empty answers
- reward correct, complete, clear explanations
- produce deterministic and explainable scoring rubric

### FR-3 Batch Interview Evaluation

1. Input:

- all questions
- all answers
- interview setup metadata

2. Output:

- per-question evaluation list
- overall score and recommendations
- strengths/improvements summary

3. Behavior:

- score consistency between single-answer and batch mode
- robust mapping between question IDs and answer IDs

### FR-4 Follow-up Question Generation (Optional but Supported)

1. Input:

- original question
- previous candidate answer

2. Output:

- one follow-up question

3. Behavior:

- should deepen or clarify the previous response

### FR-5 Backward-Compatible Service Interface

The replacement must expose equivalent methods to reduce integration changes:

1. `generateQuestionsArchitecture(params)`
2. `evaluateAnswerArchitecture(params)`
3. `evaluateAllAnswers(questions, answers, interviewSetup)`
4. `generateFollowUpQuestion(context)`

## 4. Training Data Requirements

### DR-1 Dataset Composition

1. Question generation dataset:

- `(role, skills, level) -> question set` examples

2. Answer evaluation dataset:

- `(question, answer) -> score + quality + feedback components`

3. Batch evaluation dataset:

- full interview sessions with ground-truth overall and per-question labels

### DR-2 Label Requirements

1. Numeric labels:

- score (`0-10`)
- optional sub-scores: technical, communication

2. Categorical labels:

- quality class (5 classes)

3. Feedback labels:

- strengths/improvements/missing points or rubric tags

### DR-3 Data Quality and Governance

1. Minimum standards:

- balanced difficulty and role coverage
- low label noise
- clear annotation rubric

2. Governance:

- remove PII where possible
- dataset versioning and changelog
- train/val/test split without leakage

### DR-4 Split Strategy

1. Suggested split:

- Train: 70%
- Validation: 15%
- Test: 15%

2. Ensure stratification by:

- role
- experience level
- quality class distribution

## 5. Evaluation and Testing Requirements

### ER-1 Offline Model Metrics (Mandatory)

1. Score prediction quality:

- MAE / RMSE on `0-10` scores
- Pearson/Spearman correlation with human labels

2. Quality classification:

- Accuracy
- Macro F1
- Confusion matrix

3. Feedback quality (if generated text):

- rubric coverage rate
- human evaluation score (clarity/actionability)

### ER-2 Product-Level Acceptance Metrics (Mandatory)

Define acceptance thresholds before model freeze. Example target bands:

1. Score MAE <= 1.0 (0-10 scale)
2. Quality macro F1 >= 0.75
3. Empty/gibberish detection precision >= 0.9
4. End-to-end inference latency per answer <= 2s (local) or agreed SLA

### ER-3 Reproducibility Requirements

1. Fixed random seed support
2. Versioned datasets and model checkpoints
3. Repeatable training script/command
4. Logged hyperparameters and environment details

### ER-4 Regression Test Pack

Build/maintain test suite with known expected outputs:

1. excellent answer cases
2. good/average/poor/wrong answer cases
3. edge cases:

- blank answers
- very short answers
- irrelevant text
- repeated text

### ER-5 Integration Contract Tests

1. Validate API response schema for all AI routes.
2. Verify frontend results page renders required fields without fallback defaults.
3. Validate score conversions (`0-10` to `0-100`) remain consistent.

## 6. Non-Functional Requirements

### NFR-1 Deployment Mode

1. No external Gemini API dependency in production/demo mode.
2. Model served locally or in self-hosted service.
3. Health endpoint should report new model status.

### NFR-2 Performance

1. Throughput must support concurrent interview users.
2. Memory footprint and model size should fit available hardware.
3. Fail-safe fallback behavior when model service is unavailable.

### NFR-3 Reliability

1. Structured logging of inference requests and failures.
2. Graceful degradation with explicit fallback response.
3. Monitoring for latency, error rates, and drift indicators.

### NFR-4 Security and Privacy

1. No leakage of candidate data into logs beyond necessity.
2. Secure storage of training datasets.
3. Access controls for model artifacts and evaluation reports.

## 7. Architecture and Integration Requirements

### AR-1 Backend Changes Required

1. Replace Gemini-specific implementation in service layer with ML inference adapter.
2. Preserve current route/controller contracts to avoid frontend breakage.
3. Update environment variables:

- remove/disable `GEMINI_API_KEY` dependency
- add model path/service URL/runtime configs

### AR-2 Suggested Internal Layering

1. `AIService` interface (stable contract)
2. `QuestionGenerator` module
3. `AnswerScorer` module
4. `FeedbackGenerator` module
5. `BatchEvaluator` module

This separation allows trying multiple models without changing API routes.

## 8. Demonstration Requirements for Academic Review

Prepare these artifacts for your guide:

1. Problem statement and rubric definition
2. Dataset description and labeling policy
3. Model card (architecture, parameters, hardware, training time)
4. Training curves and validation metrics
5. Final test report with confusion matrix and error analysis
6. Comparison against baseline (current heuristic/fallback or prior model)
7. Sample interview outputs (question generation + scoring + feedback)
8. Limitations and future work

## 9. Model Selection Checklist (Use After Requirements Finalization)

Use this checklist to shortlist the model:

1. Supports both generation and scoring, or can be combined with two specialized models.
2. Fits hardware constraints for training and inference.
3. Meets acceptance metrics in Section 5.
4. Produces structured JSON reliably.
5. Supports reproducible training/testing pipeline.
6. Integrates with Node backend (directly or via Python microservice).

## 10. Traceability to Current Codebase

These files define the contracts and behavior this requirement document is based on:

1. `backend/src/services/geminiService.js`
2. `backend/src/routes/interviews.js`
3. `backend/src/controllers/aiController.js`
4. `backend/src/controllers/answerController.js`
5. `backend/src/controllers/resultsController.js`
6. `backend/src/models/Interview.js`
7. `backend/src/models/Answer.js`
8. `frontend/src/pages/Results.js`
9. `frontend/src/services/interviewService.js`
10. `backend/test-scoring-accuracy.js`

## 11. Immediate Next Step

Finalize measurable acceptance thresholds in Section 5 with your guide first. Then choose model candidates that can satisfy those thresholds under your available compute and timeline.
