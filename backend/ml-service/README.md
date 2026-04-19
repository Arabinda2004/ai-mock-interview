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
- `ML_INFERENCE_MODE` (default: `heuristic`; supported: `heuristic`, `model`, `artifacts`, `trained`, `hybrid`)
- `ML_ARTIFACTS_DIR` (default: `backend/ml-service/artifacts`)
- `ML_CLASSIFIER_DIR` (optional override; default: `<ML_ARTIFACTS_DIR>/classifier`)
- `ML_REGRESSOR_DIR` (optional override; default: `<ML_ARTIFACTS_DIR>/regressor`)
- `ML_MAX_LENGTH` (default: `256`)

## Notes

- Current default scoring path is deterministic heuristic mode.
- Set `ML_INFERENCE_MODE=model` (or `artifacts`) to enable trained artifact inference with automatic fallback to heuristics.
- Training scripts in `training/` generate model artifacts expected under `artifacts/classifier` and `artifacts/regressor`.
- Node backend calls this service using `ML_SERVICE_URL`.
