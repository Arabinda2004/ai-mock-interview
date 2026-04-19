# Training Pipeline

## 1. Prepare Question Bank

```bash
python training/prepare_question_bank.py \
  --input-csv ../../data/new_interview_questions.csv \
  --output-jsonl ../data/questions.jsonl
```

## 2. Build Labeled Training Dataset

```bash
python training/build_training_dataset.py \
  --question-bank ../data/questions.jsonl \
  --output-jsonl ../data/train_dataset.jsonl \
  --seed 42
```

## 3. Train DeBERTa Models

```bash
python training/train_deberta.py \
  --dataset-jsonl ../data/train_dataset.jsonl \
  --output-dir ../artifacts \
  --model-name microsoft/deberta-v3-base \
  --epochs 3 \
  --batch-size 8 \
  --seed 42
```

### Faster Colab/T4 Training (Recommended)

```bash
python training/train_deberta.py \
  --dataset-jsonl ../data/train_dataset.jsonl \
  --output-dir ../artifacts \
  --model-name microsoft/deberta-v3-base \
  --epochs 1 \
  --batch-size 4 \
  --max-length 192 \
  --fp16 \
  --fast-mode \
  --seed 42
```

If GPU memory is tight, reduce `--batch-size` to `2` and `--max-length` to `128`.

## 4. Evaluate Trained Models

```bash
python training/evaluate_model.py \
  --test-jsonl ../artifacts/splits/test.jsonl \
  --classifier-dir ../artifacts/classifier \
  --regressor-dir ../artifacts/regressor \
  --output-dir ../artifacts/reports
```

## Expected Outputs

- `../artifacts/metrics.json`
- `../artifacts/confusion_matrix.csv`
- `../artifacts/reports/evaluation_metrics.json`
- `../artifacts/reports/confusion_matrix.csv`

These outputs satisfy the required measurable metrics: MAE, macro F1, and confusion matrix.
