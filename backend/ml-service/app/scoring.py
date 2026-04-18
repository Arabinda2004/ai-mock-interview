import random
import re
from statistics import mean
from typing import Dict, Iterable, List, Optional


QUALITY_LABELS = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor']


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def round1(value: float) -> float:
    return round(float(value), 1)


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip())


def tokenize(text: str) -> List[str]:
    normalized = normalize_text(text).lower()
    return [token for token in re.split(r'[^a-z0-9]+', normalized) if len(token) > 2]


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


def concept_coverage(expected_concepts: List[str], answer_text: str) -> Dict[str, List[str]]:
    answer_lower = answer_text.lower()
    present = []
    missing = []

    for concept in expected_concepts:
        concept_clean = concept.strip()
        if not concept_clean:
            continue

        if concept_clean.lower() in answer_lower:
            present.append(concept_clean)
        else:
            missing.append(concept_clean)

    return {
        'present': present,
        'missing': missing,
    }


def evaluate_answer(question: str, answer: str, expected_concepts: Optional[List[str]] = None) -> Dict:
    expected_concepts = expected_concepts or []

    clean_question = normalize_text(question)
    clean_answer = normalize_text(answer)

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

    answer_tokens = tokenize(clean_answer)
    question_tokens = tokenize(clean_question)
    word_count = len(answer_tokens)

    # Soft relevance estimate by token overlap with question terms.
    relevance = overlap_ratio(question_tokens, answer_tokens)

    concepts = concept_coverage(expected_concepts, clean_answer)
    concept_ratio = len(concepts['present']) / len(expected_concepts) if expected_concepts else relevance

    # Technical score favors concept coverage and relevance.
    technical_score = 10 * (0.55 * concept_ratio + 0.35 * relevance + 0.10 * min(word_count / 70, 1.0))

    # Communication score favors coherence and enough detail.
    sentence_count = len([part for part in re.split(r'[.!?]+', clean_answer) if part.strip()])
    structure_score = min(sentence_count / 3, 1.0)
    length_score = min(word_count / 60, 1.0)
    communication_score = 10 * (0.60 * length_score + 0.40 * structure_score)

    if word_count < 8:
        technical_score *= 0.55
        communication_score *= 0.60
    elif word_count < 20:
        technical_score *= 0.80

    technical_score = clamp(technical_score, 0, 10)
    communication_score = clamp(communication_score, 0, 10)

    final_score = clamp(0.7 * technical_score + 0.3 * communication_score, 0, 10)
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
        if scored['missingConcepts']:
            improvements.extend([f'Mention: {item}' for item in scored['missingConcepts'][:3]])
        if scored['score'] < 5:
            improvements.append('Improve correctness and depth with concrete examples')

        individual.append(
            {
                'questionId': question_id,
                'score': scored['score'],
                'technicalScore': scored['technicalScore'],
                'communicationScore': scored['communicationScore'],
                'strengths': strengths,
                'improvements': improvements,
                'feedback': scored['feedback'],
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
