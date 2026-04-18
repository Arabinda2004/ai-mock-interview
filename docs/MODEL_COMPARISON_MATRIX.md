# Model Comparison Matrix Against `ML_MODEL_REQUIREMENTS.md`

## 1. Scope and Assumptions

This matrix compares practical model choices for your project requirements in `docs/ML_MODEL_REQUIREMENTS.md`, especially `FR-1..FR-5`, `ER-1..ER-5`, and `NFR-1..NFR-4`.

Assumptions used for comparison:

- Inference is local or self-hosted (no Gemini API).
- You need both generation and scoring outputs with strict JSON contracts.
- You need measurable score accuracy and reproducible train/test pipelines.
- Candidate answers are mostly short-to-medium technical text responses.

Scoring legend:

- `5` = strong fit
- `4` = good fit
- `3` = workable with notable effort
- `2` = weak fit
- `1` = poor fit

## 2. Candidate Options

### Option A: Single LLM (Llama)

- Generator + evaluator model: `Llama 3.1 8B Instruct`
- Fine-tuning style: LoRA/QLoRA for domain adaptation

### Option B: Single LLM (Mistral)

- Generator + evaluator model: `Mistral Nemo Instruct 12B` (or `Mistral 7B Instruct` if hardware-limited)
- Fine-tuning style: LoRA/QLoRA

### Option C: Single LLM (Gemma)

- Generator + evaluator model: `Gemma 2 9B Instruct`
- Fine-tuning style: LoRA/QLoRA

### Option D: Hybrid Stack (Llama + Scoring Model)

- Question/follow-up generation: `Llama 3.1 8B Instruct`
- Scoring model: `DeBERTa-v3-base` fine-tuned for:
  - regression (`score 0-10`)
  - 5-class quality classification
- Feedback text: template + retrieval/rubric generation from classifier outputs

### Option E: Hybrid Stack (Mistral + Scoring Model)

- Question/follow-up generation: `Mistral 7B Instruct`
- Scoring model: `ModernBERT-base` or `DeBERTa-v3-base`
- Feedback text: template + rubric tags + optional small LLM rewrite

### Option F: Hybrid Stack (Gemma + Scoring Model)

- Question/follow-up generation: `Gemma 2 9B Instruct`
- Scoring model: `XLM-Roberta/DeBERTa-base` fine-tuned (English-only use-case still supported)
- Feedback text: template + rubric

## 3. Requirement Fit Matrix

| Requirement Group                        | A Llama Single | B Mistral Single | C Gemma Single | D Llama+DeBERTa | E Mistral+BERT | F Gemma+BERT |
| ---------------------------------------- | -------------: | ---------------: | -------------: | --------------: | -------------: | -----------: |
| FR-1 Question generation quality         |              4 |                5 |              4 |               4 |              5 |            4 |
| FR-2 Answer scoring consistency          |              3 |                3 |              3 |               5 |              5 |            5 |
| FR-3 Batch eval stability                |              3 |                3 |              3 |               5 |              5 |            5 |
| FR-4 Follow-up question quality          |              4 |                5 |              4 |               4 |              5 |            4 |
| FR-5 API contract compatibility          |              4 |                4 |              4 |               5 |              5 |            5 |
| DR-1..DR-4 trainability on your own data |              4 |                4 |              4 |               5 |              5 |            5 |
| ER-1 measurable score metrics (MAE/F1)   |              3 |                3 |              3 |               5 |              5 |            5 |
| ER-2 chance to hit MAE/F1 thresholds     |              3 |                3 |              3 |               5 |              5 |            5 |
| ER-3 reproducibility                     |              4 |                4 |              4 |               5 |              5 |            5 |
| ER-5 schema/contract testing reliability |              3 |                3 |              3 |               5 |              5 |            5 |
| NFR-2 latency under local deployment     |              3 |                3 |              3 |               4 |              4 |            4 |
| NFR-3 graceful fallback design           |              4 |                4 |              4 |               5 |              5 |            5 |
| NFR-4 privacy (self-hosted)              |              5 |                5 |              5 |               5 |              5 |            5 |
| **Total (max 65)**                       |         **47** |           **48** |         **47** |          **63** |         **64** |       **63** |

## 4. Hardware and Operational Matrix

| Option           | Typical VRAM Need (inference) | Training Complexity | Latency Risk | JSON Reliability | Notes                                                          |
| ---------------- | ----------------------------- | ------------------- | ------------ | ---------------- | -------------------------------------------------------------- |
| A Llama Single   | 10-16 GB (4-bit)              | Medium              | Medium       | Medium           | Fastest architecture to implement, weaker scoring calibration  |
| B Mistral Single | 12-20 GB (4-bit)              | Medium              | Medium       | Medium           | Strong generation quality, same scoring-calibration issue      |
| C Gemma Single   | 10-16 GB (4-bit)              | Medium              | Medium       | Medium           | Good all-round option, still less stable for numeric scoring   |
| D Llama+DeBERTa  | 8-16 GB LLM + 2-4 GB scorer   | Medium-High         | Low-Medium   | High             | Best balance of controllable generation and measurable scoring |
| E Mistral+BERT   | 10-20 GB LLM + 2-4 GB scorer  | Medium-High         | Low-Medium   | High             | Strongest overall option if hardware supports Mistral well     |
| F Gemma+BERT     | 8-16 GB LLM + 2-4 GB scorer   | Medium-High         | Low-Medium   | High             | Very practical if Gemma runs best on your machine              |

## 5. Why Hybrid Stacks Score Higher for Your Requirements

Hybrid stacks map better to your requirement doc because they separate concerns:

- Generation model optimizes `FR-1` and `FR-4`.
- Scoring model optimizes `FR-2`, `FR-3`, and `ER-1/ER-2` with objective metrics.
- This improves reproducibility and easier threshold tuning for guide-facing accuracy claims.

Single-LLM solutions are simpler but tend to be weaker on:

- score calibration consistency
- stable quality-class boundaries
- repeatable MAE/F1 improvements after training

## 6. Recommended Shortlist

### Rank 1: Option E (Mistral + BERT scorer)

Best overall if hardware is sufficient.

- Pros: strongest generation quality, high scoring measurability, best total score.
- Risks: slightly higher VRAM/runtime requirements.

### Rank 2: Option D (Llama + DeBERTa scorer)

Best practical choice with broad tooling support.

- Pros: excellent requirement fit, easier community support, robust fine-tuning ecosystem.
- Risks: generation quality slightly below Mistral in some prompts.

### Rank 3: Option F (Gemma + BERT scorer)

Strong fallback if Gemma performs better on your available hardware.

- Pros: requirement-aligned hybrid design with good efficiency.
- Risks: prompt tuning may need more iteration for interview-style generation.

## 7. Selection Decision Rules (Fast Path)

Use this decision rule set with your guide:

1. If top priority is best generation quality and you have enough VRAM: choose Option E.
2. If top priority is implementation speed + reliability on common hardware: choose Option D.
3. If your machine runs Gemma best and still meets latency target: choose Option F.
4. Avoid single-LLM options unless timeline is extremely short and metric rigor is secondary.

## 8. Suggested Next Validation Step

Before final lock-in, run a 1-week bake-off on 100-300 labeled answers:

1. Train each shortlisted scorer variant.
2. Measure `MAE`, `Macro F1`, gibberish detection precision, and latency.
3. Keep the stack that best satisfies `ER-2` thresholds with lowest ops complexity.
