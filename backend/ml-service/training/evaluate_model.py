#!/usr/bin/env python3
"""
Evaluate trained classifier/regressor artifacts on a labeled JSONL test file.

Expected input fields per row:
- question
- answer
- score
- quality
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List


QUALITY_ORDER = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Evaluate trained DeBERTa artifacts on a test dataset.')
    parser.add_argument('--test-jsonl', required=True, help='Path to JSONL test split')
    parser.add_argument('--classifier-dir', required=True, help='Path to classifier artifact directory')
    parser.add_argument('--regressor-dir', required=True, help='Path to regressor artifact directory')
    parser.add_argument('--output-dir', required=True, help='Directory for evaluation outputs')
    parser.add_argument('--batch-size', type=int, default=16)
    parser.add_argument('--max-length', type=int, default=256)
    return parser.parse_args()


def import_dependencies():
    try:
        import numpy as np  # noqa: F401
        import pandas as pd  # noqa: F401
        import torch  # noqa: F401
        from sklearn.metrics import (  # noqa: F401
            accuracy_score,
            confusion_matrix,
            f1_score,
            mean_absolute_error,
            mean_squared_error,
        )
        from transformers import AutoModelForSequenceClassification, AutoTokenizer  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            'Missing evaluation dependencies. Install backend/ml-service/requirements.txt first. '
            f'Details: {exc}'
        )


def read_jsonl(path: Path) -> List[Dict]:
    rows = []
    with path.open('r', encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def build_text(question: str, answer: str) -> str:
    return f'[QUESTION] {question} [ANSWER] {answer}'


def run_classifier_predictions(model, tokenizer, texts: List[str], batch_size: int, max_length: int):
    import torch

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)
    model.eval()

    predictions = []

    with torch.no_grad():
        for start in range(0, len(texts), batch_size):
            batch = texts[start : start + batch_size]
            encoded = tokenizer(
                batch,
                return_tensors='pt',
                truncation=True,
                padding=True,
                max_length=max_length,
            )
            encoded = {key: value.to(device) for key, value in encoded.items()}
            logits = model(**encoded).logits
            pred_ids = torch.argmax(logits, dim=-1)
            predictions.extend(pred_ids.cpu().tolist())

    return predictions


def run_regressor_predictions(model, tokenizer, texts: List[str], batch_size: int, max_length: int):
    import torch

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)
    model.eval()

    predictions = []

    with torch.no_grad():
        for start in range(0, len(texts), batch_size):
            batch = texts[start : start + batch_size]
            encoded = tokenizer(
                batch,
                return_tensors='pt',
                truncation=True,
                padding=True,
                max_length=max_length,
            )
            encoded = {key: value.to(device) for key, value in encoded.items()}
            logits = model(**encoded).logits
            batch_scores = logits.squeeze(-1).cpu().tolist()
            if isinstance(batch_scores, float):
                batch_scores = [batch_scores]
            predictions.extend(batch_scores)

    return predictions


def main() -> None:
    args = parse_args()
    import_dependencies()

    import numpy as np
    import pandas as pd
    from sklearn.metrics import (
        accuracy_score,
        confusion_matrix,
        f1_score,
        mean_absolute_error,
        mean_squared_error,
    )
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    test_path = Path(args.test_jsonl)
    classifier_dir = Path(args.classifier_dir)
    regressor_dir = Path(args.regressor_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not test_path.exists():
        raise SystemExit(f'Test JSONL not found: {test_path}')
    if not classifier_dir.exists():
        raise SystemExit(f'Classifier artifact not found: {classifier_dir}')
    if not regressor_dir.exists():
        raise SystemExit(f'Regressor artifact not found: {regressor_dir}')

    rows = read_jsonl(test_path)
    if not rows:
        raise SystemExit('Test file is empty.')

    df = pd.DataFrame(rows)

    required = {'question', 'answer', 'score', 'quality'}
    missing_required = required.difference(df.columns)
    if missing_required:
        raise SystemExit(f'Test data missing fields: {sorted(missing_required)}')

    texts = [build_text(q, a) for q, a in zip(df['question'], df['answer'])]

    labels = [label for label in QUALITY_ORDER if label in set(df['quality'])]
    label_to_id = {label: index for index, label in enumerate(labels)}
    id_to_label = {index: label for label, index in label_to_id.items()}

    true_label_ids = [label_to_id[label] for label in df['quality']]
    true_scores = df['score'].astype(float).tolist()

    cls_tokenizer = AutoTokenizer.from_pretrained(str(classifier_dir))
    cls_model = AutoModelForSequenceClassification.from_pretrained(str(classifier_dir))

    reg_tokenizer = AutoTokenizer.from_pretrained(str(regressor_dir))
    reg_model = AutoModelForSequenceClassification.from_pretrained(str(regressor_dir))

    pred_label_ids = run_classifier_predictions(
        cls_model,
        cls_tokenizer,
        texts,
        args.batch_size,
        args.max_length,
    )

    pred_scores = run_regressor_predictions(
        reg_model,
        reg_tokenizer,
        texts,
        args.batch_size,
        args.max_length,
    )

    accuracy = float(accuracy_score(true_label_ids, pred_label_ids))
    f1_macro = float(f1_score(true_label_ids, pred_label_ids, average='macro'))

    mae = float(mean_absolute_error(true_scores, pred_scores))
    rmse = float(mean_squared_error(true_scores, pred_scores) ** 0.5)
    pearson = float(np.corrcoef(true_scores, pred_scores)[0, 1]) if len(true_scores) > 1 else 0.0
    spearman = float(pd.Series(true_scores).corr(pd.Series(pred_scores), method='spearman'))
    if str(spearman) == 'nan':
        spearman = 0.0

    cm = confusion_matrix(true_label_ids, pred_label_ids, labels=list(range(len(labels))))

    cm_path = output_dir / 'confusion_matrix.csv'
    with cm_path.open('w', encoding='utf-8') as handle:
        handle.write('label,' + ','.join(labels) + '\n')
        for row_index, row_values in enumerate(cm.tolist()):
            handle.write(id_to_label[row_index] + ',' + ','.join(str(v) for v in row_values) + '\n')

    metrics = {
        'samples': len(df),
        'classification': {
            'accuracy': accuracy,
            'f1_macro': f1_macro,
            'label_map': label_to_id,
        },
        'regression': {
            'mae': mae,
            'rmse': rmse,
            'pearson': pearson,
            'spearman': spearman,
        },
        'artifacts': {
            'confusion_matrix_csv': str(cm_path),
        },
    }

    metrics_path = output_dir / 'evaluation_metrics.json'
    with metrics_path.open('w', encoding='utf-8') as handle:
        json.dump(metrics, handle, indent=2)

    print('Evaluation complete.')
    print(f'Metrics: {metrics_path}')
    print(f'Confusion matrix: {cm_path}')


if __name__ == '__main__':
    main()
