export type TaskScores = {
  taskVolume: number      // 1-3
  repeatability: number   // 1-3
  dataSensitivity: number // 1-3
  timeCost: number        // 1-3
  errorRisk: number       // 1-3
  currentTooling: number  // 1-3
}

// Weights from the AuditAI methodology (High=3, Med=2, Low=1)
const WEIGHTS = {
  taskVolume: 3,
  repeatability: 3,
  dataSensitivity: 2,
  timeCost: 2,
  errorRisk: 3,
  currentTooling: 1,
}

export function computeScore(scores: TaskScores): number {
  return (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce((total, key) => {
    return total + scores[key] * WEIGHTS[key]
  }, 0)
}

// Max possible score: (3*3 + 3*3 + 3*2 + 3*2 + 3*3 + 3*1) = 42
export const MAX_SCORE = 42
export const PILOT_THRESHOLD = 30

export function getApplicability(scores: TaskScores): 'HIGH' | 'MEDIUM' | 'LOW' {
  const score = computeScore(scores)
  if (score >= PILOT_THRESHOLD) return 'HIGH'
  if (score >= 20) return 'MEDIUM'
  return 'LOW'
}

export function getAutomationMode(scores: TaskScores): 'AUTOMATE' | 'ASSIST' | 'SKIP' {
  // Catastrophic error risk → never fully automate
  if (scores.errorRisk === 1) return 'ASSIST'

  const score = computeScore(scores)
  if (score >= PILOT_THRESHOLD && scores.dataSensitivity >= 2) return 'AUTOMATE'
  if (score >= 20) return 'ASSIST'
  return 'SKIP'
}
