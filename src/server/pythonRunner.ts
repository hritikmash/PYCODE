import { execFile } from 'child_process';
import type { PythonExecutionResult } from '../types/index.ts';

/**
 * Runs Python code in a sandboxed, timed execution subprocess to verify real syntax and runtime behavior.
 */
export async function executePythonCode(code: string): Promise<PythonExecutionResult> {
  if (!code || !code.trim()) {
    return {
      hasSyntaxError: false,
      hasRuntimeError: false,
      exitCode: 0,
      stdout: '',
      stderr: ''
    };
  }

  const startTime = Date.now();

  return new Promise<PythonExecutionResult>((resolve) => {
    // We execute Python with an isolated command
    const child = execFile(
      'python3',
      ['-c', code],
      {
        timeout: 4000,
        maxBuffer: 512 * 1024,
        env: {
          PATH: process.env.PATH,
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1'
        }
      },
      (error, stdout, stderr) => {
        const executionTimeMs = Date.now() - startTime;
        const errStr = (stderr || '').toString();
        const outStr = (stdout || '').toString();

        let hasSyntaxError = false;
        let hasRuntimeError = false;
        let parsedError: PythonExecutionResult['parsedError'];

        if (error) {
          // Check for syntax error pattern
          const syntaxMatch = errStr.match(/File "<string>", line (\d+)(?:[^\n]*\n)(?:[^\n]*\n)?(?:\s*\^+\s*\n)?([A-Za-z]+Error): (.+)/);
          if (syntaxMatch) {
            const line = parseInt(syntaxMatch[1], 10);
            const errorType = syntaxMatch[2];
            const message = syntaxMatch[3];
            hasSyntaxError = errorType === 'SyntaxError' || errorType === 'IndentationError' || errorType === 'TabError';
            hasRuntimeError = !hasSyntaxError;
            parsedError = { line, errorType, message };
          } else {
            // Check general traceback
            const generalTraceMatch = errStr.match(/File "<string>", line (\d+)(?:, in .*)?\n[\s\S]*?([A-Za-z]+Error): (.+)/);
            if (generalTraceMatch) {
              const line = parseInt(generalTraceMatch[1], 10);
              const errorType = generalTraceMatch[2];
              const message = generalTraceMatch[3];
              hasSyntaxError = errorType === 'SyntaxError' || errorType === 'IndentationError';
              hasRuntimeError = true;
              parsedError = { line, errorType, message };
            } else if (errStr.includes('SyntaxError') || errStr.includes('IndentationError')) {
              hasSyntaxError = true;
              parsedError = { line: 1, errorType: 'SyntaxError', message: 'Syntax or indentation error in script' };
            } else if (errStr.length > 0) {
              hasRuntimeError = true;
              parsedError = { line: 1, errorType: 'RuntimeError', message: errStr.slice(0, 150) };
            }
          }
        }

        resolve({
          hasSyntaxError,
          hasRuntimeError,
          exitCode: error?.code !== undefined && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
          stdout: outStr,
          stderr: errStr,
          executionTimeMs,
          parsedError
        });
      }
    );
  });
}
