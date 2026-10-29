export interface ComplexityAnalysis {
  score: number;
  rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  ratingLabel: string;
  description: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  details: {
    branches: number;
    loops: number;
    booleans: number;
    exceptions: number;
    totalDecisions: number;
  };
}

/**
 * Strips comments and string literals from Python source code
 * to prevent false positives (e.g., "# if statement" or '"or else"').
 */
function stripPythonCommentsAndStrings(code: string): string {
  // First, strip triple-quoted multi-line strings
  let sanitized = code.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, ' ');

  // Strip single/double quoted strings
  sanitized = sanitized.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');

  // Strip single-line comments (# ...)
  sanitized = sanitized
    .split('\n')
    .map(line => {
      const commentIdx = line.indexOf('#');
      return commentIdx !== -1 ? line.slice(0, commentIdx) : line;
    })
    .join('\n');

  return sanitized;
}

/**
 * Calculates McCabe's Cyclomatic Complexity for Python code.
 * Formula: M = 1 + Decision Points (branches, loops, logical operators, exception handlers).
 */
export function calculateCyclomaticComplexity(code: string): ComplexityAnalysis {
  if (!code || !code.trim()) {
    return {
      score: 1,
      rating: 'Low',
      ratingLabel: 'Low',
      description: 'Single straight-line path with no branching.',
      badgeStyle: {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-800/80',
        dot: 'bg-emerald-400'
      },
      details: {
        branches: 0,
        loops: 0,
        booleans: 0,
        exceptions: 0,
        totalDecisions: 0
      }
    };
  }

  const cleanCode = stripPythonCommentsAndStrings(code);

  // Match keyword decision points with word boundaries
  const ifMatches = cleanCode.match(/\bif\b/g) || [];
  const elifMatches = cleanCode.match(/\belif\b/g) || [];
  const forMatches = cleanCode.match(/\bfor\b/g) || [];
  const whileMatches = cleanCode.match(/\bwhile\b/g) || [];
  const exceptMatches = cleanCode.match(/\bexcept\b/g) || [];
  const caseMatches = cleanCode.match(/\bcase\b/g) || [];
  const assertMatches = cleanCode.match(/\bassert\b/g) || [];
  const andMatches = cleanCode.match(/\band\b/g) || [];
  const orMatches = cleanCode.match(/\bor\b/g) || [];

  const branches = ifMatches.length + elifMatches.length + caseMatches.length;
  const loops = forMatches.length + whileMatches.length;
  const booleans = andMatches.length + orMatches.length;
  const exceptions = exceptMatches.length + assertMatches.length;

  const totalDecisions = branches + loops + booleans + exceptions;

  // Base complexity is 1 (the single entry-to-exit path through code)
  const score = 1 + totalDecisions;

  let rating: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  let ratingLabel = 'Low';
  let description = 'Simple, linear code with minimal branching. Very easy to test and maintain.';
  let badgeStyle = {
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-800/90',
    dot: 'bg-emerald-400'
  };

  if (score >= 21) {
    rating = 'Very High';
    ratingLabel = 'Very High Risk';
    description = 'High risk: Too many nested branches and logic paths. Strongly recommended to decompose into smaller helper functions.';
    badgeStyle = {
      bg: 'bg-red-950/80',
      text: 'text-red-300',
      border: 'border-red-800/90',
      dot: 'bg-red-400'
    };
  } else if (score >= 11) {
    rating = 'High';
    ratingLabel = 'High';
    description = 'Complex logic: Moderate risk of edge-case bugs. Consider refactoring conditional branches.';
    badgeStyle = {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-800/90',
      dot: 'bg-amber-400'
    };
  } else if (score >= 6) {
    rating = 'Moderate';
    ratingLabel = 'Moderate';
    description = 'Moderate complexity: Well-structured with controlled decision points.';
    badgeStyle = {
      bg: 'bg-sky-950/70',
      text: 'text-sky-300',
      border: 'border-sky-800/90',
      dot: 'bg-sky-400'
    };
  }

  return {
    score,
    rating,
    ratingLabel,
    description,
    badgeStyle,
    details: {
      branches,
      loops,
      booleans,
      exceptions,
      totalDecisions
    }
  };
}
