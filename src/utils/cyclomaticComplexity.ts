/**
 * Static code analysis function to calculate Big-O Algorithmic Complexity (Time & Space)
 * for Python code snippets.
 *
 * Evaluates:
 * - O(1): Constant time (scalar operations, no unbounded loops)
 * - O(log n): Logarithmic (binary search, divide & conquer halving)
 * - O(n): Linear (single loop, linear traversal, comprehension)
 * - O(n log n): Linearithmic (Timsort/sort/sorted)
 * - O(n²): Quadratic (nested loops of depth 2, or loop with search)
 * - O(n³): Cubic (nested loops of depth 3)
 * - O(2ⁿ): Exponential (branching recursion e.g. naive Fibonacci)
 */

export interface ComplexityResult {
  score: number;
  rating: string;
  timeComplexity: string;
  spaceComplexity: string;
  bigO: string;
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
    nestedLoopDepth: number;
  };
}

export function calculateCyclomaticComplexity(code: string): ComplexityResult {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      score: 1,
      rating: 'Constant',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      bigO: 'O(1)',
      colorClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
      description: 'O(1) Constant Time: Direct execution with no iteration or recursive branching.',
      decisionPointsCount: 0,
      breakdown: { branches: 0, loops: 0, logicalOps: 0, exceptions: 0, others: 0, nestedLoopDepth: 0 }
    };
  }

  // Step 1: Strip comments and strings to avoid false-positives
  let cleaned = code.replace(/"""[\s\S]*?"""/g, ' ');
  cleaned = cleaned.replace(/'''[\s\S]*?'''/g, ' ');
  cleaned = cleaned.replace(/#.*$/gm, ' ');
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, ' ');
  cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, ' ');

  let branches = 0;
  let loops = 0;
  let logicalOps = 0;
  let exceptions = 0;
  let others = 0;

  // Track loop nesting depth for Big-O
  let maxLoopDepth = 0;
  const loopIndentStack: number[] = [];

  // Detect recursive function calls
  const funcDefs = (cleaned.match(/def\s+([a-zA-Z_]\w*)\s*\(/g) || []).map(m => m.replace(/def\s+/, '').replace('(', '').trim());
  let recursiveBranching = false;
  let linearRecursion = false;

  for (const funcName of funcDefs) {
    const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    const funcBodyMatch = cleaned.match(new RegExp(`def\\s+${funcName}\\b[\\s\\S]*?(?:$|\\ndef\\s)`));
    if (funcBodyMatch) {
      const callsInBody = (funcBodyMatch[0].match(callRegex) || []).length;
      if (callsInBody >= 2) {
        recursiveBranching = true; // e.g. fib(n-1) + fib(n-2) -> O(2^n)
      } else if (callsInBody === 1) {
        linearRecursion = true; // e.g. factorial(n-1) -> O(n)
      }
    }
  }

  // Detect logarithmic halving (e.g. while n > 1: n //= 2 or mid = (low + high) // 2)
  const hasLogarithmicHalving = /\bwhile\b[\s\S]*?(?:\/\/\s*2|\/\/=\s*2|>>\s*1)/i.test(cleaned) ||
    /mid\s*=\s*\(\s*\w+\s*\+\s*\w+\s*\)\s*\/\/\s*2/i.test(cleaned);

  // Detect built-in sorting (Timsort: O(n log n))
  const hasSorting = /\.sort\s*\(|sorted\s*\(/.test(cleaned);

  // Detect secondary lookup inside loop (e.g. 'for ... : if x in list' -> O(n^2))
  let hasNestedLookupInLoop = false;

  // Split into lines to analyze loop nesting & indentation
  const rawLines = code.split('\n');
  const cleanedLines = cleaned.split('\n');

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    const rawLine = rawLines[i] || '';
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Calculate line indentation
    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].replace(/\t/g, '    ').length : 0;

    // Pop loops that have ended (indent <= loop indent)
    while (loopIndentStack.length > 0 && indent <= loopIndentStack[loopIndentStack.length - 1]) {
      loopIndentStack.pop();
    }

    const isLoop = /^\b(for|while)\b/.test(trimmed);
    if (isLoop) {
      loopIndentStack.push(indent);
      if (loopIndentStack.length > maxLoopDepth) {
        maxLoopDepth = loopIndentStack.length;
      }
      loops++;
    }

    if (loopIndentStack.length >= 1) {
      if (/\bin\b|\.index\s*\(|\.count\s*\(/.test(trimmed) && !/^\bfor\b/.test(trimmed)) {
        hasNestedLookupInLoop = true;
      }
    }

    // Branching
    const ifMatches = (trimmed.match(/\bif\b/g) || []).length;
    const elifMatches = (trimmed.match(/\belif\b/g) || []).length;
    branches += ifMatches + elifMatches;

    // Logical boolean operators
    const andMatches = (trimmed.match(/\band\b/g) || []).length;
    const orMatches = (trimmed.match(/\bor\b/g) || []).length;
    logicalOps += andMatches + orMatches;

    // Exceptions
    const exceptMatches = (trimmed.match(/\bexcept\b/g) || []).length;
    exceptions += exceptMatches;

    // Others
    const withMatches = (trimmed.match(/\bwith\b/g) || []).length;
    const assertMatches = (trimmed.match(/\bassert\b/g) || []).length;
    others += withMatches + assertMatches;
  }

  // Calculate Big-O Time Complexity
  let timeComplexity = 'O(1)';
  let rating = 'Constant';
  let colorClass = 'text-emerald-400';
  let badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
  let description = 'O(1) Constant Time: Executes in bounded constant time irrespective of input size.';

  if (recursiveBranching) {
    timeComplexity = 'O(2ⁿ)';
    rating = 'Exponential';
    colorClass = 'text-red-400';
    badgeClass = 'bg-red-950/70 text-red-300 border-red-700/60';
    description = 'O(2ⁿ) Exponential Time: Branching recursive call tree doubles operations per step.';
  } else if (maxLoopDepth >= 3) {
    timeComplexity = 'O(n³)';
    rating = 'Cubic';
    colorClass = 'text-red-400';
    badgeClass = 'bg-red-950/70 text-red-300 border-red-700/60';
    description = 'O(n³) Cubic Time: 3 levels of deeply nested iteration.';
  } else if (maxLoopDepth >= 2 || (maxLoopDepth >= 1 && hasNestedLookupInLoop)) {
    timeComplexity = 'O(n²)';
    rating = 'Quadratic';
    colorClass = 'text-amber-400';
    badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-700/60';
    description = 'O(n²) Quadratic Time: Nested loops or linear lookup inside iteration.';
  } else if (hasSorting) {
    timeComplexity = 'O(n log n)';
    rating = 'Linearithmic';
    colorClass = 'text-cyan-400';
    badgeClass = 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
    description = 'O(n log n) Linearithmic Time: Comparison-based sorting algorithm.';
  } else if (maxLoopDepth >= 1 || linearRecursion) {
    timeComplexity = 'O(n)';
    rating = 'Linear';
    colorClass = 'text-sky-400';
    badgeClass = 'bg-sky-950/70 text-sky-300 border-sky-700/60';
    description = 'O(n) Linear Time: Single-pass iteration traversing input size n.';
  } else if (hasLogarithmicHalving) {
    timeComplexity = 'O(log n)';
    rating = 'Logarithmic';
    colorClass = 'text-emerald-400';
    badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
    description = 'O(log n) Logarithmic Time: Search space halves at every step.';
  }

  // Calculate Big-O Space Complexity
  let spaceComplexity = 'O(1)';
  const allocatesAuxiliaryCollections = /\[\s*.*?\bfor\b.*?\]|\.append\s*\(|\.extend\s*\(|list\s*\(|dict\s*\(|set\s*\(/.test(cleaned);
  if (recursiveBranching || (linearRecursion && !allocatesAuxiliaryCollections)) {
    spaceComplexity = 'O(n)'; // Call stack depth
  } else if (allocatesAuxiliaryCollections && maxLoopDepth >= 2) {
    spaceComplexity = 'O(n²)';
  } else if (allocatesAuxiliaryCollections || linearRecursion) {
    spaceComplexity = 'O(n)';
  }

  const decisionPointsCount = branches + loops + logicalOps + exceptions + others;
  const score = 1 + decisionPointsCount;

  return {
    score,
    rating,
    timeComplexity,
    spaceComplexity,
    bigO: timeComplexity,
    colorClass,
    badgeClass,
    description,
    decisionPointsCount,
    breakdown: { branches, loops, logicalOps, exceptions, others, nestedLoopDepth: maxLoopDepth }
  };
}

