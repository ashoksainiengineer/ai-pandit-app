/**
 * Forensic Quiz Scoring Algorithm
 * Calculates Vedic traits from quiz answers with confidence scoring
 * God Tier BTR Implementation
 */

import {
  QuizAnswer,
  QuizQuestion,
  QuizResults,
  PrakritiResult,
  TraitResult,
  FamilyResult,
  Dosha
} from './types';
import { FORENSIC_QUIZ_QUESTIONS } from './questions';

/**
 * Calculate Prakriti (Dosha) from body constitution answers
 */
export function calculatePrakriti(answers: QuizAnswer[]): PrakritiResult {
  let vata = 0, pitta = 0, kapha = 0;
  let answeredCount = 0;
  let confidence = 100;

  const prakritiQuestions = FORENSIC_QUIZ_QUESTIONS.filter(q => q.category === 'prakriti');

  answers.forEach(answer => {
    const question = prakritiQuestions.find(q => q.id === answer.questionId);
    if (!question) return;

    if (answer.isNotSure) {
      confidence -= question.confidenceImpact;
      return;
    }

    answeredCount++;

    answer.selectedOptions.forEach(optionId => {
      const option = question.options.find(o => o.id === optionId);
      if (option?.doshaScore) {
        vata += (option.doshaScore.vata || 0) * option.weight;
        pitta += (option.doshaScore.pitta || 0) * option.weight;
        kapha += (option.doshaScore.kapha || 0) * option.weight;
      }
    });
  });

  // Normalize to percentages
  const total = vata + pitta + kapha;
  if (total === 0) {
    return {
      primary: 'vata',
      scores: { vata: 33, pitta: 33, kapha: 34 },
      confidence: 0
    };
  }

  const vataPct = Math.round((vata / total) * 100);
  const pittaPct = Math.round((pitta / total) * 100);
  const kaphaPct = Math.round((kapha / total) * 100);

  // Determine primary dosha
  let primary: Dosha;
  if (vataPct >= pittaPct && vataPct >= kaphaPct) primary = 'vata';
  else if (pittaPct >= kaphaPct) primary = 'pitta';
  else primary = 'kapha';

  // Determine secondary if close
  let secondary: Dosha | undefined;
  const sorted = [
    { dosha: 'vata' as Dosha, score: vataPct },
    { dosha: 'pitta' as Dosha, score: pittaPct },
    { dosha: 'kapha' as Dosha, score: kaphaPct }
  ].sort((a, b) => b.score - a.score);

  if (sorted[1].score > sorted[0].score * 0.7) {
    secondary = sorted[1].dosha;
  }

  // Calculate confidence based on spread
  const spread = sorted[0].score - sorted[1].score;
  if (spread < 10) confidence *= 0.6;
  else if (spread < 20) confidence *= 0.8;
  else if (spread < 30) confidence *= 0.9;

  // Reduce confidence if not enough questions answered
  const completionRate = answeredCount / prakritiQuestions.length;
  if (completionRate < 0.5) confidence *= 0.5;
  else if (completionRate < 0.8) confidence *= 0.8;

  return {
    primary,
    secondary,
    scores: { vata: vataPct, pitta: pittaPct, kapha: kaphaPct },
    confidence: Math.round(confidence)
  };
}

/**
 * Calculate trait result from category answers
 */
function calculateTrait(
  answers: QuizAnswer[],
  category: string,
  questions: QuizQuestion[]
): TraitResult {
  const categoryAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q?.category === category;
  });

  const scores: Record<string, number> = {};
  let totalWeight = 0;
  let answeredCount = 0;
  let confidence = 100;

  categoryAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    if (answer.isNotSure) {
      confidence -= question.confidenceImpact;
      return;
    }

    answeredCount++;

    answer.selectedOptions.forEach(optionId => {
      const option = question.options.find(o => o.id === optionId);
      if (option) {
        scores[optionId] = (scores[optionId] || 0) + option.weight;
        totalWeight += option.weight;
      }
    });
  });

  // Find highest scoring option
  let maxScore = 0;
  let winningOption: string | null = null;
  let planetaryIndicators: string[] = [];

  Object.entries(scores).forEach(([optionId, score]) => {
    if (score > maxScore) {
      maxScore = score;
      winningOption = optionId;
    }
  });

  // Get planetary signatures for winning option
  categoryAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    answer.selectedOptions.forEach(optionId => {
      const option = question.options.find(o => o.id === optionId);
      if (option && option.planetarySignature) {
        option.planetarySignature.forEach(p => {
          if (!planetaryIndicators.includes(p)) {
            planetaryIndicators.push(p);
          }
        });
      }
    });
  });

  // Calculate confidence
  const categoryQuestions = questions.filter(q => q.category === category);
  const completionRate = answeredCount / categoryQuestions.length;
  
  if (completionRate < 0.5) confidence *= 0.5;
  else if (completionRate < 0.8) confidence *= 0.8;

  // Check for clear winner
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  if (sortedScores.length >= 2) {
    const spread = sortedScores[0] - sortedScores[1];
    if (spread < 2) confidence *= 0.7;
    else if (spread < 4) confidence *= 0.9;
  }

  // Get human-readable name
  let typeName = winningOption || 'unknown';
  categoryAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    const option = question.options.find(o => o.id === winningOption);
    if (option) {
      typeName = option.label;
    }
  });

  return {
    type: typeName,
    confidence: Math.round(confidence),
    planetaryIndicators: planetaryIndicators.slice(0, 3)
  };
}

/**
 * Calculate family context results
 */
function calculateFamily(answers: QuizAnswer[], questions: QuizQuestion[]): FamilyResult {
  let birthOrder: string = 'unknown';
  let fatherStatus: string = 'unknown';
  let confidence = 100;
  let birthOrderConfidence = 100;
  let fatherConfidence = 100;

  answers.forEach(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    if (question.category === 'family') {
      if (answer.isNotSure) {
        fatherConfidence -= question.confidenceImpact;
        return;
      }

      answer.selectedOptions.forEach(optionId => {
        const option = question.options.find(o => o.id === optionId);
        if (!option) return;

        if (optionId === 'eldest' || optionId === 'middle' || 
            optionId === 'youngest' || optionId === 'only_child') {
          birthOrder = optionId;
          birthOrderConfidence = 100;
        } else {
          fatherStatus = optionId;
          fatherConfidence = 100;
        }
      });
    }
  });

  confidence = (birthOrderConfidence + fatherConfidence) / 2;

  return {
    birthOrder: birthOrder as any,
    fatherStatus: fatherStatus as any,
    confidence: Math.round(confidence)
  };
}

/**
 * Verify trait consistency across categories
 */
export function verifyTraitConsistency(results: QuizResults): {
  isConsistent: boolean;
  alignment: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let alignmentScore = 0;
  let totalChecks = 0;

  // Check 1: Vata prakriti should align with fast speech, variable decisions
  if (results.prakriti.primary === 'vata') {
    totalChecks += 3;
    if (results.speech.type.toLowerCase().includes('fast') || 
        results.speech.type.toLowerCase().includes('variable')) {
      alignmentScore++;
    } else {
      warnings.push('Vata constitution typically has faster speech patterns');
    }

    if (results.decision.type.toLowerCase().includes('impulsive') ||
        results.decision.type.toLowerCase().includes('intuitive')) {
      alignmentScore++;
    } else {
      warnings.push('Vata types often make quick, intuitive decisions');
    }

    if (results.voice.type.toLowerCase().includes('variable') ||
        results.voice.type.toLowerCase().includes('high')) {
      alignmentScore++;
    } else {
      warnings.push('Vata voice tends to be more variable or higher pitched');
    }
  }

  // Check 2: Pitta prakriti should align with measured speech, deliberate decisions
  if (results.prakriti.primary === 'pitta') {
    totalChecks += 3;
    if (results.speech.type.toLowerCase().includes('measured') ||
        results.speech.type.toLowerCase().includes('logical')) {
      alignmentScore++;
    } else {
      warnings.push('Pitta constitution often has measured, logical speech');
    }

    if (results.decision.type.toLowerCase().includes('deliberate') ||
        results.decision.type.toLowerCase().includes('analyze')) {
      alignmentScore++;
    } else {
      warnings.push('Pitta types typically make deliberate, analyzed decisions');
    }

    if (results.voice.type.toLowerCase().includes('deep') ||
        results.voice.type.toLowerCase().includes('resonant')) {
      alignmentScore++;
    } else {
      warnings.push('Pitta voice tends to be deeper or more resonant');
    }
  }

  // Check 3: Kapha prakriti should align with soft speech, steady decisions
  if (results.prakriti.primary === 'kapha') {
    totalChecks += 3;
    if (results.speech.type.toLowerCase().includes('soft') ||
        results.speech.type.toLowerCase().includes('listen')) {
      alignmentScore++;
    } else {
      warnings.push('Kapha constitution typically has softer, more listening speech');
    }

    if (results.decision.type.toLowerCase().includes('deliberate') ||
        results.decision.type.toLowerCase().includes('steady')) {
      alignmentScore++;
    } else {
      warnings.push('Kapha types make steady, deliberate decisions');
    }

    if (results.voice.type.toLowerCase().includes('soft') ||
        results.voice.type.toLowerCase().includes('deep')) {
      alignmentScore++;
    } else {
      warnings.push('Kapha voice tends to be soft or deep');
    }
  }

  // Check 4: Eldest child often has authority markers
  if (results.family.birthOrder === 'eldest') {
    totalChecks++;
    if (results.forehead.type.toLowerCase().includes('broad') ||
        results.forehead.type.toLowerCase().includes('prominent')) {
      alignmentScore++;
    }
  }

  // Check 5: Distinguished father often correlates with strong forehead
  if (results.family.fatherStatus === 'distinguished' ||
      results.family.fatherStatus === 'prosperous') {
    totalChecks++;
    if (results.forehead.planetaryIndicators.some(p => 
      ['Sun', 'Jupiter'].includes(p))) {
      alignmentScore++;
    }
  }

  const alignment = totalChecks > 0 ? alignmentScore / totalChecks : 1;
  
  return {
    isConsistent: alignment >= 0.6,
    alignment: Math.round(alignment * 100),
    warnings
  };
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(results: QuizResults): number {
  const confidences = [
    results.prakriti.confidence * 1.2, // Weight prakriti higher
    results.forehead.confidence,
    results.eyes.confidence,
    results.voice.confidence,
    results.speech.confidence,
    results.decision.confidence,
    results.family.confidence
  ];

  const weightedSum = confidences.reduce((a, b) => a + b, 0);
  const average = weightedSum / confidences.length;

  // Boost for high consistency
  const consistency = verifyTraitConsistency(results);
  if (consistency.alignment > 80) {
    return Math.min(100, Math.round(average * 1.1));
  }

  return Math.round(average);
}

/**
 * Main scoring function - calculates all results from answers
 */
export function calculateQuizResults(answers: QuizAnswer[]): QuizResults {
  const questions = FORENSIC_QUIZ_QUESTIONS;

  const prakriti = calculatePrakriti(answers);
  const forehead = calculateTrait(answers, 'forehead', questions);
  const eyes = calculateTrait(answers, 'eyes', questions);
  const voice = calculateTrait(answers, 'voice', questions);
  const speech = calculateTrait(answers, 'speech', questions);
  const decision = calculateTrait(answers, 'decision', questions);
  const family = calculateFamily(answers, questions);

  const results: QuizResults = {
    prakriti,
    forehead,
    eyes,
    voice,
    speech,
    decision,
    family,
    overallConfidence: 0,
    answers,
    completedAt: Date.now()
  };

  results.overallConfidence = calculateOverallConfidence(results);

  return results;
}

/**
 * Get completion progress
 */
export function getQuizProgress(answers: QuizAnswer[]): {
  total: number;
  answered: number;
  percentage: number;
  categories: Record<string, { answered: number; total: number }>;
} {
  const questions = FORENSIC_QUIZ_QUESTIONS;
  const total = questions.length;
  
  const answeredQuestions = new Set(answers.map(a => a.questionId));
  const answered = answeredQuestions.size;

  const categories: Record<string, { answered: number; total: number }> = {};

  questions.forEach(q => {
    if (!categories[q.category]) {
      categories[q.category] = { answered: 0, total: 0 };
    }
    categories[q.category].total++;
    
    if (answeredQuestions.has(q.id)) {
      categories[q.category].answered++;
    }
  });

  return {
    total,
    answered,
    percentage: Math.round((answered / total) * 100),
    categories
  };
}

/**
 * Get next unanswered question
 */
export function getNextQuestion(
  answers: QuizAnswer[],
  preferCategory?: string
): QuizQuestion | null {
  const answeredIds = new Set(answers.map(a => a.questionId));
  const unanswered = FORENSIC_QUIZ_QUESTIONS.filter(q => !answeredIds.has(q.id));

  if (unanswered.length === 0) return null;

  // Prefer specific category if requested
  if (preferCategory) {
    const categoryQuestion = unanswered.find(q => q.category === preferCategory);
    if (categoryQuestion) return categoryQuestion;
  }

  // Otherwise return first unanswered
  return unanswered[0];
}

/**
 * Format results for display
 */
export function formatQuizResults(results: QuizResults): {
  summary: string;
  detailed: Record<string, string>;
  astroMapping: string;
} {
  const prakritiDesc = results.prakriti.secondary 
    ? `${results.prakriti.primary}-${results.prakriti.secondary}`
    : results.prakriti.primary;

  const summary = `Your Vedic profile suggests ${prakritiDesc.toUpperCase()} constitution with ${results.overallConfidence}% confidence.`;

  const detailed = {
    'Body Type': `${results.prakriti.primary.charAt(0).toUpperCase() + results.prakriti.primary.slice(1)} (${results.prakriti.confidence}% confident)`,
    'Forehead': `${results.forehead.type} - ${results.forehead.planetaryIndicators.join(', ')}`,
    'Eyes': results.eyes.type,
    'Voice': results.voice.type,
    'Speech Pattern': results.speech.type,
    'Decision Style': results.decision.type,
    'Birth Order': results.family.birthOrder.replace('_', ' '),
    'Father Status': results.family.fatherStatus.replace('_', ' ')
  };

  const primaryPlanet = results.prakriti.primary === 'vata' ? 'Saturn/Mercury' :
    results.prakriti.primary === 'pitta' ? 'Sun/Mars' : 'Moon/Venus/Jupiter';

  const astroMapping = `Primary planetary influence: ${primaryPlanet}. ` +
    `Forehead indicates ${results.forehead.planetaryIndicators[0] || 'balanced'} energy. ` +
    `Voice suggests ${results.voice.planetaryIndicators[0] || 'mixed'} planetary influence.`;

  return { summary, detailed, astroMapping };
}
