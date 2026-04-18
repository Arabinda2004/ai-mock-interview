#!/usr/bin/env python3
"""
Build a labeled training dataset from normalized question-bank JSONL.

Generates five quality buckets per question:
- Excellent
- Good
- Average
- Below Average
- Poor
"""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path
from typing import Dict, List


QUALITY_PROFILES = [
    {
        'quality': 'Excellent',
        'score_range': (9.0, 10.0),
        'tech_delta': 0.1,
        'comm_delta': 0.0,
    },
    {
        'quality': 'Good',
        'score_range': (7.0, 8.9),
        'tech_delta': 0.0,
        'comm_delta': 0.0,
    },
    {
        'quality': 'Average',
        'score_range': (5.0, 6.9),
        'tech_delta': 0.0,
        'comm_delta': 0.1,
    },
    {
        'quality': 'Below Average',
        'score_range': (3.0, 4.9),
        'tech_delta': -0.2,
        'comm_delta': 0.0,
    },
    {
        'quality': 'Poor',
        'score_range': (0.0, 2.9),
        'tech_delta': -0.3,
        'comm_delta': -0.2,
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Create multi-answer labeled training dataset from question bank JSONL.')
    parser.add_argument('--question-bank', required=True, help='Input JSONL from prepare_question_bank.py')
    parser.add_argument('--output-jsonl', required=True, help='Output dataset JSONL')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility')
    return parser.parse_args()


def load_jsonl(path: Path) -> List[Dict]:
    records = []
    with path.open('r', encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
    return records


def choose_score(profile: Dict) -> float:
    low, high = profile['score_range']
    return round(random.uniform(low, high), 1)


def trim_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return ' '.join(words[:max_words]).rstrip(',.') + '.'


def split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text.strip()) if s.strip()]


def answer_text_for_profile(question: str, concepts: List[str], quality: str, reference_answer: str) -> str:
    core = concepts[:3] if concepts else ['core concept']
    normalized_reference = reference_answer.strip()

    if normalized_reference:
        sentences = split_sentences(normalized_reference)
        first_sentence = sentences[0] if sentences else normalized_reference
        first_two_sentences = ' '.join(sentences[:2]) if len(sentences) > 1 else first_sentence

        if quality == 'Excellent':
            return (
                f"{normalized_reference} "
                f"A complete answer also covers {core[0]} and practical trade-offs with a concrete example."
            )

        if quality == 'Good':
            return (
                f"{first_two_sentences} "
                f"I would also mention {core[0]} and one practical use case."
            )

        if quality == 'Average':
            return trim_words(first_sentence, 18)

        if quality == 'Below Average':
            return trim_words(first_sentence, 10)

        return 'I am not sure about the full concept, but it seems related to this topic.'

    if quality == 'Excellent':
        return (
            f"{question} This concept is important because it impacts correctness, performance, and maintainability. "
            f"A strong answer should include {core[0]} and {core[1] if len(core) > 1 else 'key implementation details'}, "
            f"plus practical trade-offs and a real example showing how it works in production."
        )

    if quality == 'Good':
        return (
            f"This topic mainly involves {core[0]} and {core[1] if len(core) > 1 else 'implementation flow'}. "
            "In practice, I would explain the approach, mention one example, and call out one potential limitation."
        )

    if quality == 'Average':
        return (
            f"The main idea is {core[0]}. It is used to solve common development problems. "
            "I would explain the definition and give a simple example."
        )

    if quality == 'Below Average':
        return (
            "It is a feature used in development. I know it is useful, but I am not sure about the full details."
        )

    return 'I am not sure. Maybe it is related to coding and APIs.'


def build_record(question_item: Dict, profile: Dict) -> Dict:
    question_text = question_item.get('questionText', '').strip()
    concepts = question_item.get('expectedConcepts') or []
    reference_answer = (question_item.get('referenceAnswer') or '').strip()

    score = choose_score(profile)
    technical_score = max(0.0, min(10.0, round(score + profile['tech_delta'], 1)))
    communication_score = max(0.0, min(10.0, round(score + profile['comm_delta'], 1)))

    return {
        'question': question_text,
        'answer': answer_text_for_profile(question_text, concepts, profile['quality'], reference_answer),
        'score': score,
        'technicalScore': technical_score,
        'communicationScore': communication_score,
        'quality': profile['quality'],
        'category': question_item.get('category', 'General'),
        'difficulty': question_item.get('difficulty', 'Medium'),
        'expectedConcepts': concepts,
        'referenceAnswer': reference_answer,
    }


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    question_bank_path = Path(args.question_bank)
    output_path = Path(args.output_jsonl)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not question_bank_path.exists():
        raise SystemExit(f'Question bank file not found: {question_bank_path}')

    questions = load_jsonl(question_bank_path)
    if not questions:
        raise SystemExit('Question bank is empty. Nothing to generate.')

    dataset = []
    for question in questions:
        for profile in QUALITY_PROFILES:
            dataset.append(build_record(question, profile))

    with output_path.open('w', encoding='utf-8') as handle:
        for row in dataset:
            handle.write(json.dumps(row, ensure_ascii=True) + '\n')

    print(f'Questions loaded: {len(questions)}')
    print(f'Training samples generated: {len(dataset)}')
    print(f'Output written to: {output_path}')


if __name__ == '__main__':
    main()
