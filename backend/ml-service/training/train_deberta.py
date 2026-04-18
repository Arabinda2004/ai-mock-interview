#!/usr/bin/env python3
"""
Train DeBERTa-based models for interview answer evaluation.

This script trains two heads from the same base model:
1. Quality classification (5 classes)
2. Score regression (0-10)

Outputs:
- classifier model directory
- regressor model directory
- metrics.json (MAE, macro F1, confusion matrix metadata)
- confusion_matrix.csv
- reproducible train/val/test splits
"""

from __future__ import annotations

import argparse
import inspect
import json
import os
import random
import shutil
from pathlib import Path
from typing import Dict, List


QUALITY_ORDER = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Train DeBERTa models for scoring and quality classification.')
    parser.add_argument('--dataset-jsonl', required=True, help='Input JSONL dataset path')
    parser.add_argument('--output-dir', required=True, help='Directory to save models and reports')
    parser.add_argument('--model-name', default='microsoft/deberta-v3-base', help='HF model name or local path')
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch-size', type=int, default=8)
    parser.add_argument('--max-length', type=int, default=256)
    parser.add_argument('--learning-rate', type=float, default=2e-5)
    parser.add_argument('--seed', type=int, default=42)
    return parser.parse_args()


def import_training_dependencies():
    try:
        import numpy as np  # noqa: F401
        import pandas as pd  # noqa: F401
        import torch  # noqa: F401
        from datasets import Dataset  # noqa: F401
        from sklearn.metrics import (  # noqa: F401
            accuracy_score,
            confusion_matrix,
            f1_score,
            mean_absolute_error,
            mean_squared_error,
        )
        from sklearn.model_selection import train_test_split  # noqa: F401
        from transformers import (  # noqa: F401
            AutoModelForSequenceClassification,
            AutoTokenizer,
            Trainer,
            TrainingArguments,
            set_seed,
        )
    except ImportError as exc:
        raise SystemExit(
            'Missing training dependencies. Install backend/ml-service/requirements.txt first. '
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


def validate_dataset(records: List[Dict]) -> None:
    required = {'question', 'answer', 'score', 'quality'}
    for index, row in enumerate(records, start=1):
        missing = [field for field in required if field not in row]
        if missing:
            raise SystemExit(f'Record {index} missing required fields: {missing}')


def make_splits(df, seed: int):
    from sklearn.model_selection import train_test_split

    train_val, test = train_test_split(
        df,
        test_size=0.15,
        random_state=seed,
        stratify=df['quality'],
    )

    val_ratio = 0.15 / 0.85
    train, val = train_test_split(
        train_val,
        test_size=val_ratio,
        random_state=seed,
        stratify=train_val['quality'],
    )

    return train.reset_index(drop=True), val.reset_index(drop=True), test.reset_index(drop=True)


def save_jsonl(df, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as handle:
        for row in df.to_dict(orient='records'):
            handle.write(json.dumps(row, ensure_ascii=True) + '\n')


def build_text_fields(df):
    df = df.copy()
    df['text'] = df.apply(
        lambda row: f"[QUESTION] {row['question']} [ANSWER] {row['answer']}",
        axis=1,
    )
    df['score'] = df['score'].astype(float)
    return df


def to_hf_dataset(df, label_column: str):
    from datasets import Dataset

    subset = df[['text', label_column]].rename(columns={label_column: 'labels'})
    return Dataset.from_pandas(subset, preserve_index=False)


def tokenize_dataset(dataset, tokenizer, max_length: int):
    def tokenize(batch):
        return tokenizer(
            batch['text'],
            truncation=True,
            padding='max_length',
            max_length=max_length,
        )

    tokenized = dataset.map(tokenize, batched=True)
    tokenized.set_format(type='torch', columns=['input_ids', 'attention_mask', 'labels'])
    return tokenized


def prepare_clean_output_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def create_training_arguments(kwargs: Dict):
    from transformers import TrainingArguments

    supported = set(inspect.signature(TrainingArguments.__init__).parameters.keys())
    normalized = dict(kwargs)

    # Transformers 5 uses eval_strategy; 4.x typically uses evaluation_strategy.
    if 'evaluation_strategy' in normalized and 'evaluation_strategy' not in supported and 'eval_strategy' in supported:
        normalized['eval_strategy'] = normalized.pop('evaluation_strategy')

    filtered = {key: value for key, value in normalized.items() if key in supported}
    return TrainingArguments(**filtered)


def create_trainer(model, training_args, train_dataset, eval_dataset, tokenizer, compute_metrics):
    from transformers import Trainer

    supported = set(inspect.signature(Trainer.__init__).parameters.keys())
    trainer_kwargs = {
        'model': model,
        'args': training_args,
        'train_dataset': train_dataset,
        'eval_dataset': eval_dataset,
        'compute_metrics': compute_metrics,
    }

    if 'tokenizer' in supported:
        trainer_kwargs['tokenizer'] = tokenizer
    elif 'processing_class' in supported:
        trainer_kwargs['processing_class'] = tokenizer

    return Trainer(**trainer_kwargs)


def train_classifier(args, train_df, val_df, test_df, quality_to_id, id_to_quality):
    import numpy as np
    from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    train_data = train_df.copy()
    val_data = val_df.copy()
    test_data = test_df.copy()

    train_data['label'] = train_data['quality'].map(quality_to_id)
    val_data['label'] = val_data['quality'].map(quality_to_id)
    test_data['label'] = test_data['quality'].map(quality_to_id)

    train_ds = tokenize_dataset(to_hf_dataset(train_data, 'label'), tokenizer, args.max_length)
    val_ds = tokenize_dataset(to_hf_dataset(val_data, 'label'), tokenizer, args.max_length)
    test_ds = tokenize_dataset(to_hf_dataset(test_data, 'label'), tokenizer, args.max_length)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=len(quality_to_id),
        id2label=id_to_quality,
        label2id=quality_to_id,
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        predictions = np.argmax(logits, axis=-1)
        return {
            'accuracy': float(accuracy_score(labels, predictions)),
            'f1_macro': float(f1_score(labels, predictions, average='macro')),
        }

    classifier_output_dir = Path(args.output_dir) / 'classifier'
    prepare_clean_output_dir(classifier_output_dir)

    training_args = create_training_arguments(
        {
            'output_dir': str(classifier_output_dir),
            'overwrite_output_dir': True,
            'num_train_epochs': args.epochs,
            'per_device_train_batch_size': args.batch_size,
            'per_device_eval_batch_size': args.batch_size,
            'learning_rate': args.learning_rate,
            'evaluation_strategy': 'epoch',
            'save_strategy': 'epoch',
            'load_best_model_at_end': True,
            'metric_for_best_model': 'f1_macro',
            'greater_is_better': True,
            'logging_steps': 50,
            'report_to': 'none',
            'save_total_limit': 2,
        }
    )

    trainer = create_trainer(
        model=model,
        training_args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    test_metrics = trainer.evaluate(test_ds, metric_key_prefix='test')

    prediction_output = trainer.predict(test_ds)
    pred_ids = np.argmax(prediction_output.predictions, axis=-1)
    true_ids = test_data['label'].to_numpy()

    cm = confusion_matrix(true_ids, pred_ids, labels=list(range(len(quality_to_id))))

    trainer.save_model(str(Path(args.output_dir) / 'classifier'))
    tokenizer.save_pretrained(str(Path(args.output_dir) / 'classifier'))

    return {
        'test_metrics': test_metrics,
        'true_ids': true_ids.tolist(),
        'pred_ids': pred_ids.tolist(),
        'confusion_matrix': cm.tolist(),
    }


def train_regressor(args, train_df, val_df, test_df):
    import numpy as np
    import pandas as pd
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    train_data = train_df.copy()
    val_data = val_df.copy()
    test_data = test_df.copy()

    train_data['score_label'] = train_data['score'].astype(float)
    val_data['score_label'] = val_data['score'].astype(float)
    test_data['score_label'] = test_data['score'].astype(float)

    train_ds = tokenize_dataset(to_hf_dataset(train_data, 'score_label'), tokenizer, args.max_length)
    val_ds = tokenize_dataset(to_hf_dataset(val_data, 'score_label'), tokenizer, args.max_length)
    test_ds = tokenize_dataset(to_hf_dataset(test_data, 'score_label'), tokenizer, args.max_length)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=1,
        problem_type='regression',
    )

    def compute_metrics(eval_pred):
        predictions, labels = eval_pred
        preds = np.squeeze(predictions)
        mae = mean_absolute_error(labels, preds)
        rmse = float(mean_squared_error(labels, preds) ** 0.5)
        return {
            'mae': float(mae),
            'rmse': float(rmse),
        }

    regressor_output_dir = Path(args.output_dir) / 'regressor'
    prepare_clean_output_dir(regressor_output_dir)

    training_args = create_training_arguments(
        {
            'output_dir': str(regressor_output_dir),
            'overwrite_output_dir': True,
            'num_train_epochs': args.epochs,
            'per_device_train_batch_size': args.batch_size,
            'per_device_eval_batch_size': args.batch_size,
            'learning_rate': args.learning_rate,
            'evaluation_strategy': 'epoch',
            'save_strategy': 'epoch',
            'load_best_model_at_end': True,
            'metric_for_best_model': 'mae',
            'greater_is_better': False,
            'logging_steps': 50,
            'report_to': 'none',
            'save_total_limit': 2,
        }
    )

    trainer = create_trainer(
        model=model,
        training_args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    test_metrics = trainer.evaluate(test_ds, metric_key_prefix='test')

    prediction_output = trainer.predict(test_ds)
    pred_scores = np.squeeze(prediction_output.predictions)
    true_scores = test_data['score_label'].to_numpy()

    mae = mean_absolute_error(true_scores, pred_scores)
    rmse = float(mean_squared_error(true_scores, pred_scores) ** 0.5)
    pearson = float(np.corrcoef(true_scores, pred_scores)[0, 1]) if len(true_scores) > 1 else 0.0
    spearman = float(pd.Series(true_scores).corr(pd.Series(pred_scores), method='spearman'))

    trainer.save_model(str(Path(args.output_dir) / 'regressor'))
    tokenizer.save_pretrained(str(Path(args.output_dir) / 'regressor'))

    return {
        'test_metrics': test_metrics,
        'mae': float(mae),
        'rmse': float(rmse),
        'pearson': pearson,
        'spearman': 0.0 if str(spearman) == 'nan' else float(spearman),
    }


def main() -> None:
    args = parse_args()
    import_training_dependencies()

    import pandas as pd
    from transformers import set_seed

    random.seed(args.seed)
    os.environ['PYTHONHASHSEED'] = str(args.seed)
    set_seed(args.seed)

    dataset_path = Path(args.dataset_jsonl)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not dataset_path.exists():
        raise SystemExit(f'Dataset path not found: {dataset_path}')

    records = read_jsonl(dataset_path)
    if not records:
        raise SystemExit('Input dataset is empty.')

    validate_dataset(records)

    df = pd.DataFrame(records)
    df = build_text_fields(df)

    # Keep quality labels in a stable order.
    unique_labels = [label for label in QUALITY_ORDER if label in set(df['quality'])]
    quality_to_id = {label: index for index, label in enumerate(unique_labels)}
    id_to_quality = {index: label for label, index in quality_to_id.items()}

    if len(unique_labels) < 3:
        raise SystemExit('At least 3 quality classes are required for meaningful classification training.')

    train_df, val_df, test_df = make_splits(df, args.seed)

    # Save reproducible splits.
    save_jsonl(train_df, output_dir / 'splits' / 'train.jsonl')
    save_jsonl(val_df, output_dir / 'splits' / 'val.jsonl')
    save_jsonl(test_df, output_dir / 'splits' / 'test.jsonl')

    cls_result = train_classifier(args, train_df, val_df, test_df, quality_to_id, id_to_quality)
    reg_result = train_regressor(args, train_df, val_df, test_df)

    # Write confusion matrix as CSV for easy reporting.
    cm_path = output_dir / 'confusion_matrix.csv'
    with cm_path.open('w', encoding='utf-8') as handle:
        header = 'label,' + ','.join(unique_labels)
        handle.write(header + '\n')
        for row_index, row_values in enumerate(cls_result['confusion_matrix']):
            label = id_to_quality[row_index]
            handle.write(label + ',' + ','.join(str(v) for v in row_values) + '\n')

    metrics_payload = {
        'model': args.model_name,
        'seed': args.seed,
        'splits': {
            'train': len(train_df),
            'validation': len(val_df),
            'test': len(test_df),
        },
        'classification': {
            'label_map': quality_to_id,
            'test_metrics': cls_result['test_metrics'],
        },
        'regression': {
            'test_metrics': reg_result['test_metrics'],
            'mae': reg_result['mae'],
            'rmse': reg_result['rmse'],
            'pearson': reg_result['pearson'],
            'spearman': reg_result['spearman'],
        },
        'artifacts': {
            'classifier_dir': str(output_dir / 'classifier'),
            'regressor_dir': str(output_dir / 'regressor'),
            'confusion_matrix_csv': str(cm_path),
        },
    }

    metrics_path = output_dir / 'metrics.json'
    with metrics_path.open('w', encoding='utf-8') as handle:
        json.dump(metrics_payload, handle, indent=2)

    print('Training complete.')
    print(f'Metrics: {metrics_path}')
    print(f'Confusion matrix: {cm_path}')


if __name__ == '__main__':
    main()
