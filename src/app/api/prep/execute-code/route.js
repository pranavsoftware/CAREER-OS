import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import vm from 'node:vm';

export const runtime = 'nodejs';

/**
 * Normalizes values for comparison (handles arrays, objects, booleans, floats)
 */
function isResultEqual(actual, expected) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 1e-3;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every((val, i) => isResultEqual(val, expected[i]));
  }
  if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
    const keysA = Object.keys(actual).sort();
    const keysB = Object.keys(expected).sort();
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k, i) => k === keysB[i] && isResultEqual(actual[k], expected[k]));
  }
  return actual === expected;
}

/**
 * Execute JavaScript code in an isolated Node VM context
 */
async function executeJavaScript(code, testCases, functionName) {
  const startTime = Date.now();
  const results = [];

  try {
    const sandbox = {
      console: {
        log: () => {},
        error: () => {},
        warn: () => {},
      },
    };

    const context = vm.createContext(sandbox);

    // Run user code
    const script = new vm.Script(code);
    script.runInContext(context, { timeout: 3000 });

    // Determine target function
    let fn = null;
    if (functionName) {
      try {
        fn = vm.runInContext(functionName, context);
      } catch (e) {}
    }

    if (!fn || typeof fn !== 'function') {
      // Try finding function name via regex
      const fnMatch = code.match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>|\w+\s*=>))/);
      const detectedName = fnMatch ? (fnMatch[1] || fnMatch[2]) : null;
      if (detectedName) {
        try {
          fn = vm.runInContext(detectedName, context);
        } catch (e) {}
      }
    }

    if (!fn || typeof fn !== 'function') {
      // Check top-level properties on context
      for (const k of Object.keys(context)) {
        if (typeof context[k] === 'function' && k !== 'console') {
          fn = context[k];
          break;
        }
      }
    }

    if (!fn || typeof fn !== 'function') {
      throw new Error('No executable function found in your code. Please check your function definition.');
    }

    // Run test cases
    for (const tc of testCases) {
      const tcStart = performance.now();
      try {
        const args = JSON.parse(JSON.stringify(tc.args || []));
        const actual = fn(...args);
        const tcTime = Math.round((performance.now() - tcStart) * 100) / 100;
        const passed = isResultEqual(actual, tc.expectedOutput);

        results.push({
          id: tc.id,
          inputDisplay: tc.inputDisplay,
          expected: tc.expectedOutput,
          actual: actual === undefined ? 'undefined' : actual,
          passed,
          timeMs: tcTime,
          isHidden: tc.isHidden || false,
          error: null,
        });
      } catch (tcErr) {
        results.push({
          id: tc.id,
          inputDisplay: tc.inputDisplay,
          expected: tc.expectedOutput,
          actual: null,
          passed: false,
          timeMs: Math.round((performance.now() - tcStart) * 100) / 100,
          isHidden: tc.isHidden || false,
          error: tcErr.message || 'Runtime execution error',
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const passedTests = results.filter(r => r.passed).length;

    return {
      success: true,
      allPassed: passedTests === results.length,
      passedTests,
      totalTests: results.length,
      executionTimeMs: totalTime,
      results,
    };
  } catch (err) {
    return {
      success: false,
      allPassed: false,
      error: err.message || 'Script compilation or execution failed',
      results: [],
    };
  }
}

/**
 * Execute Python code via local python binary
 */
function executePython(code, testCases, functionName) {
  return new Promise((resolve) => {
    const rawTestCasesJson = JSON.stringify(testCases);
    const harness = `
import sys, json, time, math, traceback

raw_code = ${JSON.stringify(code)}
test_cases = json.loads(${JSON.stringify(rawTestCasesJson)})
function_name = ${JSON.stringify(functionName || '')}

scope = {}
try:
    exec(raw_code, scope)
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": f"Syntax/Load Error: {str(e)}",
        "results": []
    }))
    sys.exit(0)

target_fn = None
if function_name and function_name in scope and callable(scope[function_name]):
    target_fn = scope[function_name]
else:
    for k, v in scope.items():
        if callable(v) and not k.startswith("__"):
            target_fn = v
            break

if not target_fn:
    print(json.dumps({
        "success": False,
        "error": "No callable function found in submission.",
        "results": []
    }))
    sys.exit(0)

def are_equal(act, exp):
    if isinstance(act, float) and isinstance(exp, (float, int)):
        return abs(act - exp) < 1e-3
    if isinstance(act, (list, tuple)) and isinstance(exp, (list, tuple)):
        if len(act) != len(exp):
            return False
        return all(are_equal(a, b) for a, b in zip(act, exp))
    if isinstance(act, dict) and isinstance(exp, dict):
        if set(act.keys()) != set(exp.keys()):
            return False
        return all(are_equal(act[k], exp[k]) for k in act)
    return act == exp

results = []
all_passed = True
start_all = time.time()

for tc in test_cases:
    t0 = time.time()
    try:
        args = tc.get("args", [])
        actual = target_fn(*args)
        t_ms = round((time.time() - t0) * 1000, 2)
        expected = tc.get("expectedOutput")
        passed = are_equal(actual, expected)
        if not passed:
            all_passed = False
        results.append({
            "id": tc.get("id"),
            "inputDisplay": tc.get("inputDisplay"),
            "expected": expected,
            "actual": actual,
            "passed": passed,
            "timeMs": t_ms,
            "isHidden": tc.get("isHidden", False),
            "error": None
        })
    except Exception as e:
        all_passed = False
        results.append({
            "id": tc.get("id"),
            "inputDisplay": tc.get("inputDisplay"),
            "expected": tc.get("expectedOutput"),
            "actual": None,
            "passed": False,
            "timeMs": round((time.time() - t0) * 1000, 2),
            "isHidden": tc.get("isHidden", False),
            "error": str(e)
        })

print(json.dumps({
    "success": True,
    "allPassed": all_passed,
    "passedTests": sum(1 for r in results if r["passed"]),
    "totalTests": len(results),
    "executionTimeMs": round((time.time() - start_all) * 1000, 2),
    "results": results
}))
`;

    const py = spawn('python', ['-c', harness], {
      timeout: 5000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (d) => {
      stdout += d.toString('utf-8');
    });

    py.stderr.on('data', (d) => {
      stderr += d.toString('utf-8');
    });

    py.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn Python runner: ${err.message}`,
        results: [],
      });
    });

    py.on('close', (exitCode) => {
      if (exitCode !== 0 && !stdout.trim()) {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${exitCode}`,
          results: [],
        });
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err) {
        resolve({
          success: false,
          error: stderr || stdout || 'Unable to parse execution output',
          results: [],
        });
      }
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { language = 'python', code = '', testCases = [], functionName = '' } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No code submitted for execution.',
      }, { status: 400 });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No test cases provided.',
      }, { status: 400 });
    }

    let result;
    if (language === 'javascript') {
      result = await executeJavaScript(code, testCases, functionName);
    } else if (language === 'python') {
      result = await executePython(code, testCases, functionName);
    } else {
      return NextResponse.json({
        success: false,
        error: `Live sandbox currently supports Python 3 and JavaScript (Node.js). C++ and Java syntax support is available in offline mode.`,
      }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Execute code API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}
