/**
 * Static code analysis function to calculate McCabe's Cyclomatic Complexity
 * for Python code snippets.
 *
 * Formula: Complexity = 1 + Decision Points
 * Decision points in Python:
 * - Branching statements: if, elif, for, while, except, with, assert
 * - Short-circuit boolean operators: and, or
 * - Comprehensions with conditionals: if
 */

export interface ComplexityResult {
  score: number;
  rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  colorClass: string;
  badgeClass: string;
  description: string;
  decisionPointsCount: number;
  breakdown: {
    branches: number;
    loops: number;
    logicalOps: number;
    exceptions: number;
    others: number;
  };
}

export function calculateCyclomaticComplexity(code: string): ComplexityResult {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      score: 1,
      rating: 'Low',
      colorClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
      description: 'Simple linear flow with 0 decision branches.',
      decisionPointsCount: 0,
      breakdown: { branches: 0, loops: 0, logicalOps: 0, exceptions: 0, others: 0 }
    };
  }

  // Step 1: Strip comments and strings to avoid false-positives
  // Remove multiline docstrings """...""" and '''...'''
  let cleaned = code.replace(/"""[\s\S]*?"""/g, ' ');
  cleaned = cleaned.replace(/'''[\s\S]*?'''/g, ' ');

  // Remove single line comments # ...
  cleaned = cleaned.replace(/#.*$/gm, ' ');

  // Remove string literals "..." and '...'
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, ' ');
  cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, ' ');

  let branches = 0;
  let loops = 0;
  let logicalOps = 0;
  let exceptions = 0;
  let others = 0;

  // Split into lines and analyze keywords using word boundary regexes
  const lines = cleaned.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Branches: if, elif
    const ifMatches = (trimmed.match(/\bif\b/g) || []).length;
    const elifMatches = (trimmed.match(/\belif\b/g) || []).length;
    branches += ifMatches + elifMatches;

    // Loops: for, while
    const forMatches = (trimmed.match(/\bfor\b/g) || []).length;
    const whileMatches = (trimmed.match(/\bwhile\b/g) || []).length;
    loops += forMatches + whileMatches;

    // Logical boolean operators: and, or
    const andMatches = (trimmed.match(/\band\b/g) || []).length;
    const orMatches = (trimmed.match(/\bor\b/g) || []).length;
    logicalOps += andMatches + orMatches;

    // Exception handling: except
    const exceptMatches = (trimmed.match(/\bexcept\b/g) || []).length;
    exceptions += exceptMatches;

    // Other decision points: with, assert
    const withMatches = (trimmed.match(/\bwith\b/g) || []).length;
    const assertMatches = (trimmed.match(/\bassert\b/g) || []).length;
    others += withMatches + assertMatches;
  }

  const decisionPointsCount = branches + loops + logicalOps + exceptions + others;
  const score = 1 + decisionPointsCount;

  let rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  let colorClass: string;
  let badgeClass: string;
  let description: string;

  if (score <= 5) {
    rating = 'Low';
    colorClass = 'text-emerald-400';
    badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
    description = 'Simple, structured code with low risk and high testability.';
  } else if (score <= 10) {
    rating = 'Moderate';
    colorClass = 'text-sky-400';
    badgeClass = 'bg-sky-950/70 text-sky-300 border-sky-700/60';
    description = 'Moderate complexity. Manageable logic, easy to test.';
  } else if (score <= 20) {
    rating = 'High';
    colorClass = 'text-amber-400';
    badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-700/60';
    description = 'High complexity. Complex conditional nesting; consider decomposing.';
  } else {
    rating = 'Very High';
    colorClass = 'text-red-400';
    badgeClass = 'bg-red-950/70 text-red-300 border-red-700/60';
    description = 'Very high complexity. Fragile, difficult to trace and test.';
  }

  return {
    score,
    rating,
    colorClass,
    badgeClass,
    description,
    decisionPointsCount,
    breakdown: { branches, loops, logicalOps, exceptions, others }
  };
}
