from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EvaluateRequest(BaseModel):
    question: str = ''
    answer: str = ''
    expectedConcepts: List[str] = Field(default_factory=list)


class EvaluateResponse(BaseModel):
    score: float
    maxScore: int = 10
    technicalScore: float
    communicationScore: float
    quality: str
    feedback: str
    missingConcepts: List[str] = Field(default_factory=list)
    missingPoints: List[str] = Field(default_factory=list)
    improvementTip: str


class BatchQuestion(BaseModel):
    questionId: Optional[str] = None
    id: Optional[str] = None
    question: Optional[str] = None
    questionText: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    expectedConcepts: List[str] = Field(default_factory=list)


class BatchAnswer(BaseModel):
    questionId: Optional[str] = None
    answer: str = ''
    timeSpent: Optional[int] = 0


class BatchEvaluateRequest(BaseModel):
    questions: List[BatchQuestion] = Field(default_factory=list)
    answers: List[BatchAnswer] = Field(default_factory=list)
    interviewSetup: Dict[str, Any] = Field(default_factory=dict)


class IndividualEvaluation(BaseModel):
    questionId: str
    score: float
    technicalScore: float
    communicationScore: float
    quality: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    missingPoints: List[str] = Field(default_factory=list)
    feedback: str
    improvementTip: Optional[str] = None


class BatchEvaluateResponse(BaseModel):
    individualEvaluations: List[IndividualEvaluation]
    overallScore: float
    technicalScore: float
    communicationScore: float
    confidenceScore: float
    overallStrengths: List[str] = Field(default_factory=list)
    overallImprovements: List[str] = Field(default_factory=list)
    technicalAssessment: str
    communicationAssessment: str
    recommendation: str
    detailedFeedback: str


class FollowUpRequest(BaseModel):
    originalQuestion: str = ''
    previousAnswer: str = ''


class FollowUpResponse(BaseModel):
    question: str


class GenerateQuestionsRequest(BaseModel):
    role: str = 'Software Engineer'
    skills: List[str] = Field(default_factory=list)
    experienceLevel: str = 'mid'
    questionCount: int = 8


class GeneratedQuestion(BaseModel):
    questionText: str
    difficulty: str
    category: str
    expectedConcepts: List[str] = Field(default_factory=list)


class GenerateQuestionsResponse(BaseModel):
    questions: List[GeneratedQuestion] = Field(default_factory=list)
