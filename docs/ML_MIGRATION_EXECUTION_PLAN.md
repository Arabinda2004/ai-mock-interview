# ML Migration Execution Plan (Gemini -> Self-Hosted ML)

## 1. Goal and Guardrails

This plan replaces Gemini-based answer evaluation with a reproducible ML pipeline while preserving existing frontend/backend API contracts.

### Non-negotiable guardrails

- Keep API response format backward-compatible for frontend pages and existing routes.
- No Gemini runtime dependency for evaluation path.
- Maintain measurable model quality: MAE, macro F1, confusion matrix.
- Keep the system reproducible: versioned dataset, deterministic split, fixed training config.

## 2. Scope for This Repository

### In scope

- Backend service abstraction for AI operations.
- FastAPI ML service for inference.
- Dataset preparation pipeline from question CSV.
- Training/evaluation scripts for DeBERTa scoring + quality classification.
- Integration tests for response schema, edge-case behavior, and latency checks.

### Out of scope for first cut

- Production-grade MLOps (feature store, drift retraining scheduler).
- GPU orchestration/cluster deployment.

## 3. Refined Phase Plan

## Phase A: Contract-First Integration (Day 1)

### Tasks

1. Introduce a new backend ML adapter with the same methods used by routes/controllers:
   - generateQuestionsArchitecture(params)
   - evaluateAnswerArchitecture(params)
   - evaluateAllAnswers(questions, answers, interviewSetup)
   - generateFollowUpQuestion(context)
2. Replace direct Gemini imports in live call paths.
3. Keep output schema unchanged.

### Deliverables

- New ML adapter service file.
- Routes/controllers switched to ML adapter.
- Health endpoint reports ML service status.

### Acceptance criteria

- Existing interview flow still works from frontend.
- Response fields consumed by Results page still exist.

## Phase B: Dataset Pipeline (Day 2-4)

### Tasks

1. Convert question CSV to internal JSONL question-bank format.
2. Generate expectedConcepts for each question.
3. Generate multi-answer labeled dataset per question:
   - Excellent, Good, Average, Below Average, Poor/Incorrect
4. Store final training records with:
   - question, answer, score, technicalScore, communicationScore, quality

### Deliverables

- scripts/prepare_question_bank.py
- scripts/build_training_dataset.py
- data/questions.jsonl
- data/train_dataset.jsonl

### Acceptance criteria

- Dataset contains all required labels and schema.
- At least minimum sample size target achieved (>= 200), with path to 500+.

## Phase C: Model Training and Evaluation (Day 5-7)

### Tasks

1. Train DeBERTa-v3-base on question-answer pair input.
2. Multi-task outputs:
   - Regression head for score (0-10)
   - Classification head for quality label (5 classes)
3. Deterministic split: 70/15/15.
4. Compute mandatory metrics:
   - MAE
   - Macro F1
   - Confusion matrix

### Deliverables

- training/train_deberta.py
- training/evaluate_model.py
- artifacts/model checkpoint
- reports/metrics.json and confusion matrix image

### Acceptance criteria

- Metrics generated on held-out test split.
- Repeatable run with documented seed and commands.

## Phase D: Feedback Logic (Day 8)

### Tasks

1. Implement expectedConcepts coverage analysis.
2. Produce missingConcepts array and templated feedback.

### Deliverables

- feedback module with deterministic concept matching.

### Acceptance criteria

- Missing concept output appears in inference payload.

## Phase E: FastAPI Inference Service (Day 9)

### Tasks

1. Build inference API endpoints:
   - POST /evaluate
   - POST /evaluate-batch
   - GET /health
2. Return backend-compatible schema.

### Deliverables

- FastAPI app with model loading and fallback behavior.

### Acceptance criteria

- Single-answer and batch evaluation return required fields.

## Phase F: Backend Integration and Switch (Day 10)

### Tasks

1. Wire Node backend to call FastAPI via ML adapter.
2. Keep route signatures unchanged.
3. Remove Gemini dependency from execution path.

### Deliverables

- Updated environment variables and service wiring.

### Acceptance criteria

- Frontend works without API contract changes.

## Phase G: Testing and Validation (Day 11)

### Test set

- Perfect answers
- Bad answers
- Empty answers
- Irrelevant answers

### Validation checks

- Response schema compliance.
- Latency target: <2s median per answer locally (or documented hardware-adjusted SLA).
- Consistency across repeated runs.

## Phase H: Demo Package (Day 12)

### Demo contents

1. Dataset creation process and coverage.
2. Model architecture/training pipeline.
3. Metrics dashboard (MAE/F1/confusion matrix).
4. Live end-to-end interview evaluation demo.

## 4. Corrective Notes on the Rough Plan

- Keep question generation and answer scoring concerns separate; scoring must not depend on static reference answer matching.
- Include a strict schema-contract test so frontend compatibility cannot regress.
- Track quality class boundaries centrally to avoid drift between training and inference logic.
- Plan for fallback behavior when ML service is unavailable; degrade gracefully but preserve API shape.

## 5. Work Breakdown Used in This Repo (Immediate)

1. Implement contract-first adapter and switch integration paths.
2. Add FastAPI service scaffold with schema-compatible outputs.
3. Add dataset + training scripts and reproducibility configs.
4. Add migration docs and env changes.
5. Run sanity checks and provide next execution steps.
