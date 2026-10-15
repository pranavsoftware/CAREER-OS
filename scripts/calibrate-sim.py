import sys, os, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
from evaluation_engine import embed_texts, np

student = 'In React, instead of touching the browser layout directly which is slow, it keeps a tree of plain JS objects that mirrors the page structure. Whenever state updates, React constructs a fresh tree and performs a comparison with the old state tree. It figures out the exact elements that actually modified and groups those changes together so only the changed nodes are touched in the browser. Also, when rendering lists, having stable identifiers is super important so React does not needlessly recreate unchanged children.'
rubric = [
    'Virtual DOM as JavaScript in-memory object representation',
    'Diffing algorithm and reconciliation process (Fiber)',
    'Batching DOM updates for performance',
    'Role of unique keys in list diffing'
]
sentences = [s.strip() for s in re.split(r'[.!?\n]+', student) if len(s.strip().split()) >= 4]
sent_vecs = embed_texts(sentences)
r_vecs = embed_texts(rubric)

for i, r in enumerate(rubric):
    sims = [float(np.dot(sent_vecs[j], r_vecs[i])) for j in range(len(sentences))]
    best_idx = np.argmax(sims)
    print(f'Point {i} ({r}): max_sim={sims[best_idx]:.3f} with "{sentences[best_idx]}"')
