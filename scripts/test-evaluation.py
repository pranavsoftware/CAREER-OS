import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-service'))

from evaluation_engine import evaluate_student_answer

question = "Can you explain how the Virtual DOM works in React, and how the reconciliation algorithm decides when and what to re-render in the actual DOM?"
model_answer = "The Virtual DOM is a lightweight JavaScript object representation of the real DOM. When state or props change, React creates a new Virtual DOM tree and runs a diffing algorithm (Reconciliation / Fiber) comparing it with the previous snapshot. It computes the minimum set of mutations needed (batched updates) and applies them to the real browser DOM. Keys help React identify which items have changed, moved, or deleted in lists without re-rendering the entire list."
rubric_points = [
    "Virtual DOM as JavaScript in-memory object representation",
    "Diffing algorithm and reconciliation process (Fiber)",
    "Batching DOM updates for performance",
    "Role of unique keys in list diffing"
]

# Test 1: Strong paraphrased answer (does NOT copy exact keywords, but explains concepts well)
paraphrased_answer = """
In React, instead of touching the browser layout directly which is slow, it keeps a tree of plain JS objects that mirrors the page structure. 
Whenever state updates, React constructs a fresh tree and performs a comparison with the old state tree. 
It figures out the exact elements that actually modified and groups those changes together so only the changed nodes are touched in the browser. 
Also, when rendering lists, having stable identifiers is super important so React doesn't needlessly recreate unchanged children.
"""

# Test 2: Poor / brief answer
poor_answer = "React uses virtual dom because it makes it faster and updates the screen."

print("\n--- TEST 1: Paraphrased Answer Evaluation ---")
t0 = time.time()
result1 = evaluate_student_answer(question, model_answer, rubric_points, paraphrased_answer, "Core Fundamentals")
print(f"Time: {time.time() - t0:.2f}s")
print(f"Evaluator: {result1.get('evaluator')}")
print(f"Score: {result1.get('score')} (Tech: {result1.get('technicalAccuracy')}, Comm: {result1.get('communicationClarity')})")
print(f"Feedback: {result1.get('feedback')}")
print(f"Strengths: {result1.get('strengths')}")
print(f"Improvements: {result1.get('improvements')}")
print(f"Covered: {result1.get('keyPointsCovered')}")
print(f"Missed: {result1.get('keyPointsMissed')}")

print("\n--- TEST 2: Poor Answer Evaluation ---")
t0 = time.time()
result2 = evaluate_student_answer(question, model_answer, rubric_points, poor_answer, "Core Fundamentals")
print(f"Time: {time.time() - t0:.2f}s")
print(f"Evaluator: {result2.get('evaluator')}")
print(f"Score: {result2.get('score')} (Tech: {result2.get('technicalAccuracy')}, Comm: {result2.get('communicationClarity')})")
print(f"Feedback: {result2.get('feedback')}")
