# FastAPI ML Service

This service replaces Gemini-based runtime evaluation with a self-hosted inference API.

## Endpoints

- `GET /health`
- `POST /evaluate`
- `POST /evaluate-batch`
- `POST /follow-up`
- `POST /generate-questions`

## Local Run

```bash
cd backend/ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment Variables

- `ML_MODEL_NAME` (default: `deberta-v3-base`)
- `ML_INFERENCE_MODE` (default: `heuristic`)

## Notes

- Current default scoring path is deterministic heuristic mode.
- Training scripts in `training/` can be used to replace heuristic mode with model-backed inference.
- Node backend calls this service using `ML_SERVICE_URL`.
