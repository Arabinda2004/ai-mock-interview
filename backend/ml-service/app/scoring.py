import os
import random
import re
import threading
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional


QUALITY_LABELS = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor']
MODEL_LABEL_ORDER = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']

STOP_WORDS = {
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i',
    'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'so', 'the', 'their', 'them',
    'there', 'these', 'they', 'this', 'those', 'to', 'was', 'we', 'what', 'when', 'where', 'which',
    'who', 'why', 'with', 'would', 'you', 'your'
}

GENERIC_QUESTION_TOKENS = {
    'between', 'common', 'core', 'different', 'difference', 'explain', 'important', 'most', 'real', 'should',
    'useful', 'works', 'project', 'projects', 'system', 'systems'
}

INFERENCE_MODE = os.getenv('ML_INFERENCE_MODE', 'heuristic').strip().lower()
ML_ARTIFACTS_DIR = Path(
    os.getenv('ML_ARTIFACTS_DIR', str(Path(__file__).resolve().parents[1] / 'artifacts'))
)
ML_CLASSIFIER_DIR = Path(os.getenv('ML_CLASSIFIER_DIR', str(ML_ARTIFACTS_DIR / 'classifier')))
ML_REGRESSOR_DIR = Path(os.getenv('ML_REGRESSOR_DIR', str(ML_ARTIFACTS_DIR / 'regressor')))
ML_MAX_LENGTH = int(os.getenv('ML_MAX_LENGTH', '256'))

_RUNTIME_LOCK = threading.Lock()
_RUNTIME: Optional[Dict[str, Any]] = None
_RUNTIME_ERROR: Optional[str] = None


def _is_model_mode() -> bool:
    return INFERENCE_MODE in {'model', 'artifacts', 'trained', 'hybrid'}


def _normalize_quality_label(label: Optional[str]) -> Optional[str]:
    if not label:
        return None

    clean = str(label).strip()
    if clean in QUALITY_LABELS:
        return clean

    lowered = clean.lower().replace('-', ' ').replace('_', ' ').strip()
    aliases = {
        'excellent': 'Excellent',
        'good': 'Good',
        'average': 'Average',
        'below average': 'Below Average',
        'poor': 'Poor',
    }
    if lowered in aliases:
        return aliases[lowered]

    if lowered.startswith('label '):
        try:
            index = int(lowered.split(' ')[-1])
            if 0 <= index < len(MODEL_LABEL_ORDER):
                return MODEL_LABEL_ORDER[index]
        except ValueError:
            return None

    if lowered.startswith('label_'):
        try:
            index = int(lowered.split('_')[-1])
            if 0 <= index < len(MODEL_LABEL_ORDER):
                return MODEL_LABEL_ORDER[index]
        except ValueError:
            return None

    return None


def _resolve_label_from_config(id2label: Optional[Any], prediction_id: int) -> Optional[str]:
    if not id2label:
        return None

    if isinstance(id2label, (list, tuple)):
        if 0 <= prediction_id < len(id2label):
            return _normalize_quality_label(id2label[prediction_id])
        return None

    if prediction_id in id2label:
        return _normalize_quality_label(id2label[prediction_id])

    key = str(prediction_id)
    if key in id2label:
        return _normalize_quality_label(id2label[key])

    return None


def get_inference_status() -> Dict[str, Any]:
    classifier_exists = ML_CLASSIFIER_DIR.exists()
    regressor_exists = ML_REGRESSOR_DIR.exists()

    return {
        'mode': INFERENCE_MODE,
        'modelMode': _is_model_mode(),
        'artifactsDir': str(ML_ARTIFACTS_DIR),
        'classifierDir': str(ML_CLASSIFIER_DIR),
        'regressorDir': str(ML_REGRESSOR_DIR),
        'classifierExists': classifier_exists,
        'regressorExists': regressor_exists,
        'runtimeLoaded': _RUNTIME is not None,
        'device': _RUNTIME['device'] if _RUNTIME else None,
        'loadError': _RUNTIME_ERROR,
    }


def _load_artifact_runtime() -> Optional[Dict[str, Any]]:
    global _RUNTIME, _RUNTIME_ERROR

    if not _is_model_mode():
        return None

    if _RUNTIME is not None:
        return _RUNTIME

    with _RUNTIME_LOCK:
        if _RUNTIME is not None:
            return _RUNTIME

        if not ML_CLASSIFIER_DIR.exists() or not ML_REGRESSOR_DIR.exists():
            _RUNTIME_ERROR = (
                'Artifact directories not found. '
                f'classifier={ML_CLASSIFIER_DIR}, regressor={ML_REGRESSOR_DIR}'
            )
            return None

        try:
            import torch
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            device = 'cuda' if torch.cuda.is_available() else 'cpu'

            classifier_tokenizer = AutoTokenizer.from_pretrained(str(ML_CLASSIFIER_DIR))
            classifier_model = AutoModelForSequenceClassification.from_pretrained(str(ML_CLASSIFIER_DIR))
            classifier_model.to(device)
            classifier_model.eval()

            regressor_tokenizer = AutoTokenizer.from_pretrained(str(ML_REGRESSOR_DIR))
            regressor_model = AutoModelForSequenceClassification.from_pretrained(str(ML_REGRESSOR_DIR))
            regressor_model.to(device)
            regressor_model.eval()

            _RUNTIME = {
                'torch': torch,
                'device': device,
                'classifier_model': classifier_model,
                'classifier_tokenizer': classifier_tokenizer,
                'regressor_model': regressor_model,
                'regressor_tokenizer': regressor_tokenizer,
            }
            _RUNTIME_ERROR = None
        except Exception as exc:
            _RUNTIME = None
            _RUNTIME_ERROR = str(exc)

    return _RUNTIME


def _build_model_input(question: str, answer: str) -> str:
    return f'[QUESTION] {question} [ANSWER] {answer}'


def _predict_with_artifacts(question: str, answer: str) -> Optional[Dict[str, Any]]:
    global _RUNTIME_ERROR

    runtime = _load_artifact_runtime()
    if runtime is None:
        return None

    torch = runtime['torch']
    device = runtime['device']
    text = _build_model_input(question, answer)

    try:
        with torch.no_grad():
            cls_encoded = runtime['classifier_tokenizer'](
                text,
                return_tensors='pt',
                truncation=True,
                padding=True,
                max_length=ML_MAX_LENGTH,
            )
            cls_encoded = {key: value.to(device) for key, value in cls_encoded.items()}
            cls_logits = runtime['classifier_model'](**cls_encoded).logits
            pred_id = int(torch.argmax(cls_logits, dim=-1).item())

            label = _resolve_label_from_config(runtime['classifier_model'].config.id2label, pred_id)
            if label is None:
                label = MODEL_LABEL_ORDER[max(0, min(pred_id, len(MODEL_LABEL_ORDER) - 1))]

            reg_encoded = runtime['regressor_tokenizer'](
                text,
                return_tensors='pt',
                truncation=True,
                padding=True,
                max_length=ML_MAX_LENGTH,
            )
            reg_encoded = {key: value.to(device) for key, value in reg_encoded.items()}
            reg_logits = runtime['regressor_model'](**reg_encoded).logits
            score = float(reg_logits.squeeze(-1).item())
    except Exception as exc:
        _RUNTIME_ERROR = f'Artifact inference failed: {exc}'
        return None

    score = clamp(score, 0.0, 10.0)
    answer_tokens = tokenize(answer)
    sentence_count = len([part for part in re.split(r'[.!?]+', answer) if part.strip()])

    communication_score = clamp(2.5 + min(len(answer_tokens) / 18.0, 5.5) + min(sentence_count / 2.0, 2.0), 0.0, 10.0)
    technical_anchor = {'Excellent': 9.0, 'Good': 7.5, 'Average': 5.5, 'Below Average': 3.5, 'Poor': 2.0}[label]
    technical_score = clamp(0.8 * score + 0.2 * technical_anchor, 0.0, 10.0)

    return {
        'score': round1(score),
        'technicalScore': round1(technical_score),
        'communicationScore': round1(communication_score),
        'quality': label,
    }


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def round1(value: float) -> float:
    return round(float(value), 1)


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip())


def tokenize(text: str, keep_stop_words: bool = False) -> List[str]:
    normalized = normalize_text(text).lower()
    raw_tokens = [token for token in re.split(r'[^a-z0-9+#.]+', normalized) if len(token) > 1]

    if keep_stop_words:
        return raw_tokens

    return [token for token in raw_tokens if len(token) > 2 and token not in STOP_WORDS]


def _extract_expected_concepts_from_question(question: str) -> List[str]:
    question_lower = normalize_text(question).lower()
    inferred: List[str] = []

    comparison_match = re.search(
        r'(?:difference|compare|comparison)\s+between\s+([a-z0-9+#.\-]+)\s+and\s+([a-z0-9+#.\-]+)',
        question_lower,
    )
    if comparison_match:
        for candidate in comparison_match.groups():
            candidate = normalize_text(candidate)
            if candidate and candidate not in inferred:
                inferred.append(candidate)

    pattern_candidates = [
        r'what is ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)',
        r'explain ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)',
        r'define ([a-z0-9+#.\- ]+?)(?:\?|,| and | where | when | in |$)',
    ]

    for pattern in pattern_candidates:
        match = re.search(pattern, question_lower)
        if match:
            candidate = normalize_text(match.group(1))
            if candidate:
                candidate_tokens = [
                    token
                    for token in tokenize(candidate)
                    if token not in GENERIC_QUESTION_TOKENS
                ]

                if candidate_tokens:
                    for token in candidate_tokens[:3]:
                        if token not in inferred:
                            inferred.append(token)
                elif candidate not in inferred:
                    inferred.append(candidate)
            break

    for token in tokenize(question_lower):
        if token in GENERIC_QUESTION_TOKENS:
            continue

        if token not in inferred:
            inferred.append(token)

        if len(inferred) >= 5:
            break

    return inferred


def quality_from_score(score: float) -> str:
    if score >= 9:
        return 'Excellent'
    if score >= 7:
        return 'Good'
    if score >= 5:
        return 'Average'
    if score >= 3:
        return 'Below Average'
    return 'Poor'


def overlap_ratio(a: Iterable[str], b: Iterable[str]) -> float:
    set_a = set(a)
    set_b = set(b)
    if not set_a:
        return 0.0
    return len(set_a.intersection(set_b)) / len(set_a)


def _concept_matches_answer(concept: str, answer_lower: str, answer_tokens_set: set) -> bool:
    concept_lower = normalize_text(concept).lower()
    if not concept_lower:
        return False

    if concept_lower in answer_lower:
        return True

    concept_tokens = tokenize(concept_lower, keep_stop_words=True)
    filtered_tokens = [token for token in concept_tokens if token not in STOP_WORDS]
    if filtered_tokens:
        concept_tokens = filtered_tokens

    if not concept_tokens:
        return False

    overlap = len(set(concept_tokens).intersection(answer_tokens_set))
    required_overlap = max(1, (len(set(concept_tokens)) + 1) // 2)
    return overlap >= required_overlap


def concept_coverage(expected_concepts: List[str], answer_text: str) -> Dict[str, List[str]]:
    answer_lower = answer_text.lower()
    answer_tokens_set = set(tokenize(answer_text, keep_stop_words=True))
    present = []
    missing = []

    for concept in expected_concepts:
        concept_clean = concept.strip()
        if not concept_clean:
            continue

        if _concept_matches_answer(concept_clean, answer_lower, answer_tokens_set):
            present.append(concept_clean)
        else:
            missing.append(concept_clean)

    return {
        'present': present,
        'missing': missing,
    }


def _compute_heuristic_scores(
    question_text: str,
    answer_text: str,
    expected_concepts: List[str],
    concepts: Dict[str, List[str]],
) -> Dict[str, float]:
    answer_tokens = tokenize(answer_text)
    question_tokens = [token for token in tokenize(question_text) if token not in GENERIC_QUESTION_TOKENS]
    answer_token_set = set(answer_tokens)
    word_count = len(answer_tokens)

    overlap_count = len(set(question_tokens).intersection(answer_token_set))
    relevance = overlap_ratio(question_tokens, answer_tokens)

    min_overlap_for_floor = 1 if len(question_tokens) <= 2 else 2
    if word_count >= 35 and overlap_count >= min_overlap_for_floor:
        relevance = max(relevance, 0.45)

    if expected_concepts:
        concept_ratio = len(concepts['present']) / len(expected_concepts)
    else:
        concept_ratio = max(relevance, min(word_count / 120.0, 0.35))

    technical_score = 10 * (0.50 * concept_ratio + 0.30 * relevance + 0.20 * min(word_count / 80.0, 1.0))

    sentence_count = len([part for part in re.split(r'[.!?]+', answer_text) if part.strip()])
    structure_score = min(sentence_count / 4.0, 1.0)
    length_score = min(word_count / 70.0, 1.0)
    communication_score = 10 * (0.65 * length_score + 0.35 * structure_score)

    if word_count < 10:
        technical_score *= 0.50
        communication_score *= 0.55
    elif word_count < 25:
        technical_score *= 0.68
        communication_score *= 0.80
    elif word_count < 40:
        technical_score *= 0.85

    if len(concepts['present']) >= 2:
        technical_score += 0.3

    technical_score = clamp(technical_score, 0, 10)
    communication_score = clamp(communication_score, 0, 10)
    final_score = clamp(0.72 * technical_score + 0.28 * communication_score, 0, 10)

    return {
        'score': final_score,
        'technicalScore': technical_score,
        'communicationScore': communication_score,
    }


def evaluate_answer(question: str, answer: str, expected_concepts: Optional[List[str]] = None) -> Dict:
    expected_concepts = [normalize_text(concept) for concept in (expected_concepts or []) if normalize_text(concept)]

    clean_question = normalize_text(question)
    clean_answer = normalize_text(answer)

    if not expected_concepts:
        expected_concepts = _extract_expected_concepts_from_question(clean_question)

    if not clean_answer:
        return {
            'score': 0.0,
            'maxScore': 10,
            'technicalScore': 0.0,
            'communicationScore': 0.0,
            'quality': 'Poor',
            'feedback': 'No answer was provided.',
            'missingConcepts': expected_concepts,
            'missingPoints': expected_concepts if expected_concepts else ['Provide a direct answer to the question'],
            'improvementTip': 'Start with a definition, then add one short practical example.',
        }

    concepts = concept_coverage(expected_concepts, clean_answer)
    heuristic_scores = _compute_heuristic_scores(clean_question, clean_answer, expected_concepts, concepts)
    model_prediction = _predict_with_artifacts(clean_question, clean_answer)

    if model_prediction is not None:
        final_score = clamp(0.70 * model_prediction['score'] + 0.30 * heuristic_scores['score'], 0, 10)
        technical_score = clamp(
            0.70 * model_prediction['technicalScore'] + 0.30 * heuristic_scores['technicalScore'],
            0,
            10,
        )
        communication_score = clamp(
            0.70 * model_prediction['communicationScore'] + 0.30 * heuristic_scores['communicationScore'],
            0,
            10,
        )
    else:
        final_score = heuristic_scores['score']
        technical_score = heuristic_scores['technicalScore']
        communication_score = heuristic_scores['communicationScore']

    quality = quality_from_score(final_score)

    if quality == 'Excellent':
        feedback = 'Strong answer with clear technical depth and communication.'
    elif quality == 'Good':
        feedback = 'Good answer. Add a bit more technical depth or edge cases to improve further.'
    elif quality == 'Average':
        feedback = 'Your answer is partially correct but needs better coverage of key points.'
    elif quality == 'Below Average':
        feedback = 'Your answer is limited and misses important concepts expected in interview responses.'
    else:
        feedback = 'The answer is weak or incomplete for the asked question.'

    if concepts['missing']:
        feedback += f" Missing concepts: {', '.join(concepts['missing'][:3])}."

    improvement_tip = (
        'Use a 3-part structure: definition, how it works, and one practical example.'
        if quality in {'Average', 'Below Average', 'Poor'}
        else 'Keep your current structure and include a concise trade-off discussion.'
    )

    return {
        'score': round1(final_score),
        'maxScore': 10,
        'technicalScore': round1(technical_score),
        'communicationScore': round1(communication_score),
        'quality': quality,
        'feedback': feedback,
        'missingConcepts': concepts['missing'],
        'missingPoints': concepts['missing'],
        'improvementTip': improvement_tip,
    }


def evaluate_batch(questions: List[Dict], answers: List[Dict], interview_setup: Optional[Dict] = None) -> Dict:
    interview_setup = interview_setup or {}

    answer_by_id = {}
    for index, answer in enumerate(answers):
        qid = answer.get('questionId') if isinstance(answer, dict) else None
        if qid:
            answer_by_id[qid] = answer
        answer_by_id[f'index_{index}'] = answer

    individual = []

    for index, question in enumerate(questions):
        question_id = (
            question.get('questionId')
            or question.get('id')
            or f'question_{index + 1}'
        )

        question_text = question.get('question') or question.get('questionText') or ''
        expected_concepts = question.get('expectedConcepts') or []

        answer = answer_by_id.get(question_id) or answer_by_id.get(f'index_{index}') or {}
        answer_text = answer.get('answer') if isinstance(answer, dict) else ''

        scored = evaluate_answer(question_text, answer_text, expected_concepts)

        strengths = []
        improvements = []

        if scored['score'] >= 7:
            strengths.append('Demonstrated clear understanding of the concept')
        if scored['communicationScore'] >= 7:
            strengths.append('Communicated answer clearly and with structure')
        if scored['missingPoints']:
            improvements.extend(scored['missingPoints'][:3])
        if scored['score'] < 5:
            improvements.append('Improve correctness and depth with concrete examples')

        # Keep ordering stable while removing duplicates.
        improvements = list(dict.fromkeys(improvements))

        individual.append(
            {
                'questionId': question_id,
                'score': scored['score'],
                'technicalScore': scored['technicalScore'],
                'communicationScore': scored['communicationScore'],
                'quality': scored['quality'],
                'strengths': strengths,
                'improvements': improvements,
                'missingPoints': scored['missingPoints'],
                'feedback': scored['feedback'],
                'improvementTip': scored['improvementTip'],
            }
        )

    if not individual:
        return {
            'individualEvaluations': [],
            'overallScore': 0.0,
            'technicalScore': 0.0,
            'communicationScore': 0.0,
            'confidenceScore': 0.0,
            'overallStrengths': [],
            'overallImprovements': ['No answers were evaluated'],
            'technicalAssessment': 'No technical assessment available.',
            'communicationAssessment': 'No communication assessment available.',
            'recommendation': 'Insufficient data for recommendation.',
            'detailedFeedback': 'No answers were available for evaluation.',
        }

    overall_score = mean(item['score'] for item in individual)
    technical_avg = mean(item['technicalScore'] for item in individual)
    communication_avg = mean(item['communicationScore'] for item in individual)

    if overall_score >= 8:
        recommendation = 'Strong performance. Recommended for the next round.'
    elif overall_score >= 6:
        recommendation = 'Moderate performance. Recommend targeted improvement before next round.'
    else:
        recommendation = 'Performance below target. Recommend focused practice before progression.'

    overall_strengths = [
        'Completed interview flow successfully',
        'Provided answer attempts for multiple questions',
    ]

    overall_improvements = [
        'Increase concept coverage for each response',
        'Use clear examples and implementation details',
    ]

    if interview_setup.get('skills'):
        sampled_skill = random.choice(interview_setup['skills'])
        overall_improvements.append(f'Review core fundamentals of {sampled_skill}')

    return {
        'individualEvaluations': individual,
        'overallScore': round1(overall_score),
        'technicalScore': round1(technical_avg),
        'communicationScore': round1(communication_avg),
        'confidenceScore': round1(overall_score),
        'overallStrengths': overall_strengths,
        'overallImprovements': overall_improvements,
        'technicalAssessment': (
            f'Average technical score: {round1(technical_avg)}/10. '
            'Focus on correctness and concept completeness for higher ratings.'
        ),
        'communicationAssessment': (
            f'Average communication score: {round1(communication_avg)}/10. '
            'Use structured responses with concise examples.'
        ),
        'recommendation': recommendation,
        'detailedFeedback': (
            'Evaluation completed with a deterministic rubric. '
            'Prioritize missing concepts and add practical examples to improve scores.'
        ),
    }


def generate_follow_up_question(original_question: str, previous_answer: str) -> str:
    clean_answer = normalize_text(previous_answer)

    if not clean_answer:
        return 'Could you first give a concise definition before diving into details?'

    if len(tokenize(clean_answer)) < 15:
        return 'Can you expand that with a practical example from a real system?'

    return (
        'What trade-offs or edge cases would you consider for the approach '
        'you just described?'
    )


def generate_questions(role: str, skills: List[str], experience_level: str, question_count: int) -> Dict:
    role = role or 'Software Engineer'
    skills = skills or ['general programming']
    experience_level = (experience_level or 'mid').lower()

    difficulty = 'Medium'
    if 'junior' in experience_level or 'entry' in experience_level:
        difficulty = 'Easy'
    if 'senior' in experience_level or 'lead' in experience_level:
        difficulty = 'Hard'

    generated = []

    for index in range(max(1, min(question_count, 12))):
        skill = skills[index % len(skills)]
        generated.append(
            {
                'questionText': f'Explain a core concept of {skill} relevant to a {role} role.',
                'difficulty': difficulty,
                'category': f'{skill} Fundamentals',
                'expectedConcepts': [
                    'definition',
                    'use case',
                    'best practice',
                ],
            }
        )

    return {'questions': generated}
