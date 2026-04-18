#!/usr/bin/env python3
"""
Convert a raw CSV question file into normalized JSONL question-bank records.

Expected output schema per line:
{
  "questionText": "...",
  "category": "...",
  "difficulty": "Easy|Medium|Hard",
    "expectedConcepts": ["..."],
    "referenceAnswer": "..."
}
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, List


STOPWORDS = {
    'what', 'when', 'where', 'which', 'will', 'would', 'could', 'should', 'about',
    'into', 'from', 'with', 'that', 'this', 'those', 'these', 'their', 'there',
    'have', 'has', 'your', 'you', 'explain', 'describe', 'difference', 'between',
    'using', 'used', 'why', 'how', 'does', 'work', 'works', 'define', 'concept',
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Prepare normalized question bank JSONL from CSV.')
    parser.add_argument('--input-csv', required=True, help='Path to source CSV file')
    parser.add_argument('--output-jsonl', required=True, help='Path to output JSONL file')
    parser.add_argument('--max-concepts', type=int, default=5, help='Max expected concepts per question')
    return parser.parse_args()


def normalize_difficulty(raw: str) -> str:
    text = (raw or '').strip().lower()
    if text in {'easy', 'beginner', 'junior', 'low'}:
        return 'Easy'
    if text in {'hard', 'advanced', 'senior', 'high'}:
        return 'Hard'
    return 'Medium'


def split_concepts(raw: str) -> List[str]:
    if not raw:
        return []
    parts = re.split(r'[;,|]+', raw)
    return [part.strip() for part in parts if part.strip()]


def normalize_reference_answer(raw: str) -> str:
    text = (raw or '').strip()
    text = re.sub(r'^answer\s*:\s*', '', text, flags=re.IGNORECASE)
    return text


def extract_keywords_from_question(question: str, max_items: int) -> List[str]:
    tokens = re.split(r'[^a-zA-Z0-9]+', question.lower())
    seen = set()
    keywords = []

    for token in tokens:
        if len(token) < 4 or token in STOPWORDS:
            continue
        if token in seen:
            continue
        seen.add(token)
        keywords.append(token)
        if len(keywords) >= max_items:
            break

    return keywords


def first_non_empty(row: Dict[str, str], candidates: List[str], default: str = '') -> str:
    for key in candidates:
        value = row.get(key)
        if value and value.strip():
            return value.strip()
    return default


def main() -> None:
    args = parse_args()

    input_path = Path(args.input_csv)
    output_path = Path(args.output_jsonl)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise SystemExit(f'Input CSV not found: {input_path}')

    records = []

    with input_path.open('r', encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)

        for row in reader:
            question_text = first_non_empty(
                row,
                ['questionText', 'question', 'Question', 'prompt', 'text'],
            )

            if not question_text:
                continue

            category = first_non_empty(
                row,
                ['category', 'Category', 'topic', 'Topic', 'skill', 'Skill'],
                default='General',
            )

            difficulty = normalize_difficulty(
                first_non_empty(row, ['difficulty', 'Difficulty', 'level', 'Level'])
            )

            concept_raw = first_non_empty(
                row,
                ['expectedConcepts', 'expected_concepts', 'keyConcepts', 'concepts'],
            )
            concepts = split_concepts(concept_raw)

            reference_answer = normalize_reference_answer(
                first_non_empty(
                    row,
                    ['referenceAnswer', 'answer', 'Answer', 'idealAnswer', 'sampleAnswer'],
                )
            )

            if not concepts:
                keyword_source = question_text
                if reference_answer:
                    keyword_source = f'{question_text} {reference_answer}'
                concepts = extract_keywords_from_question(keyword_source, args.max_concepts)

            records.append(
                {
                    'questionText': question_text,
                    'category': category,
                    'difficulty': difficulty,
                    'expectedConcepts': concepts[: args.max_concepts],
                    'referenceAnswer': reference_answer,
                }
            )

    with output_path.open('w', encoding='utf-8') as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=True) + '\n')

    print(f'Prepared question-bank records: {len(records)}')
    print(f'Output written to: {output_path}')


if __name__ == '__main__':
    main()
