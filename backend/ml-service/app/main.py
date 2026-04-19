import os

from fastapi import FastAPI

from .schemas import (
    BatchEvaluateRequest,
    BatchEvaluateResponse,
    EvaluateRequest,
    EvaluateResponse,
    FollowUpRequest,
    FollowUpResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
)
from .scoring import (
    evaluate_answer,
    evaluate_batch,
    get_inference_status,
    generate_follow_up_question,
    generate_questions,
)


MODEL_NAME = os.getenv('ML_MODEL_NAME', 'deberta-v3-base')
INFERENCE_MODE = os.getenv('ML_INFERENCE_MODE', 'heuristic')

app = FastAPI(
    title='AI Interview ML Service',
    version='1.0.0',
    description='Self-hosted ML service for interview answer scoring and feedback',
)


@app.get('/health')
def health() -> dict:
    inference = get_inference_status()
    return {
        'status': 'ok',
        'model': MODEL_NAME,
        'mode': INFERENCE_MODE,
        'service': 'fastapi-ml-evaluator',
        'inference': inference,
    }


@app.post('/evaluate', response_model=EvaluateResponse)
def evaluate(payload: EvaluateRequest) -> EvaluateResponse:
    result = evaluate_answer(payload.question, payload.answer, payload.expectedConcepts)
    return EvaluateResponse(**result)


@app.post('/evaluate-batch', response_model=BatchEvaluateResponse)
def evaluate_batch_endpoint(payload: BatchEvaluateRequest) -> BatchEvaluateResponse:
    result = evaluate_batch(
        [item.model_dump() for item in payload.questions],
        [item.model_dump() for item in payload.answers],
        payload.interviewSetup,
    )
    return BatchEvaluateResponse(**result)


@app.post('/follow-up', response_model=FollowUpResponse)
def follow_up(payload: FollowUpRequest) -> FollowUpResponse:
    question = generate_follow_up_question(payload.originalQuestion, payload.previousAnswer)
    return FollowUpResponse(question=question)


@app.post('/generate-questions', response_model=GenerateQuestionsResponse)
def generate_questions_endpoint(payload: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    generated = generate_questions(
        payload.role,
        payload.skills,
        payload.experienceLevel,
        payload.questionCount,
    )
    return GenerateQuestionsResponse(**generated)
