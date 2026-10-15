import { useState, useRef, useEffect } from 'react';
import { Code2, ShieldAlert, Play, RotateCcw, CheckCircle2, Lock } from 'lucide-react';

export default function LiveCodeEditor({
  question,
  initialCode = '',
  onSubmitCode,
  onMalpracticeAlert,
  disabled = false,
}) {
  const [code, setCode] = useState(initialCode || question.codeSnippet || '');
  const [pasteWarning, setPasteWarning] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef(null);
  const lastChangeTimeRef = useRef(Date.now());
  const lastLengthRef = useRef(0);

  useEffect(() => {
    const snippet = initialCode || question.codeSnippet || '';
    setCode(snippet);
    setLineCount(snippet.split('\n').length);
    setCharCount(snippet.length);
    lastLengthRef.current = snippet.length;
  }, [question, initialCode]);

  // Strict Anti-Cheating: Intercept and Block Clipboard Pasting
  function handlePaste(e) {
    e.preventDefault();
    setPasteWarning(true);
    onMalpracticeAlert?.('Clipboard Paste Blocked: External code copying is prohibited. You must type your implementation manually.');
    setTimeout(() => setPasteWarning(false), 4500);
  }

  // Handle Tab key indentation inside code editor
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }

  // Keystroke cadence detector for sudden bulk injections
  function handleChange(e) {
    const val = e.target.value;
    const now = Date.now();
    const timeDiff = now - lastChangeTimeRef.current;
    const lengthDiff = val.length - lastLengthRef.current;

    // If more than 30 characters appear in less than 60ms without paste event
    if (lengthDiff > 30 && timeDiff < 60) {
      onMalpracticeAlert?.('Script Injection / External Bulk Text detected in Code Editor.');
    }

    lastChangeTimeRef.current = now;
    lastLengthRef.current = val.length;

    setCode(val);
    setCharCount(val.length);
    setLineCount(val.split('\n').length);
  }

  function handleReset() {
    if (confirm('Reset code editor to the starter challenge template?')) {
      const resetCode = question.codeSnippet || '';
      setCode(resetCode);
      setLineCount(resetCode.split('\n').length);
      setCharCount(resetCode.length);
    }
  }

  return (
    <div style={{ background: '#0F172A', borderRadius: 8, border: '1px solid #334155', overflow: 'hidden', marginBottom: 14 }}>
      {/* Code Editor Top Bar */}
      <div
        style={{
          background: '#090D16',
          borderBottom: '1px solid #1E293B',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontSize: 13, fontWeight: 700 }}>
            <Code2 size={16} />
            <span>Interactive Code Studio ({question.language || 'javascript'})</span>
          </div>

          <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F87171', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={11} />
            <span>PASTE BLOCKED • ANTI-CHEAT ACTIVE</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94A3B8',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>

          <span style={{ fontSize: 11, color: '#64748B' }}>
            {lineCount} lines • {charCount} chars
          </span>
        </div>
      </div>

      {/* Paste Blocked Notification */}
      {pasteWarning && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          }}
        >
          <ShieldAlert size={16} />
          <span>Clipboard paste blocked! You must manually type your implementation. Copying code from external devices or ChatGPT is strictly monitored.</span>
        </div>
      )}

      {/* Code Textarea with Line Numbers effect */}
      <div style={{ position: 'relative', display: 'flex' }}>
        {/* Line Numbers Column */}
        <div
          style={{
            width: 44,
            background: '#090D16',
            color: '#475569',
            fontFamily: 'Consolas, "Fira Code", monospace',
            fontSize: 13,
            lineHeight: '21px',
            padding: '12px 6px',
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid #1E293B',
          }}
        >
          {Array.from({ length: Math.max(8, lineCount) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input Area */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="// Type your code solution here..."
          rows={Math.max(12, Math.min(22, lineCount + 2))}
          spellCheck={false}
          style={{
            flex: 1,
            background: '#0B1120',
            color: '#E2E8F0',
            fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
            fontSize: 13,
            lineHeight: '21px',
            padding: 12,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            whiteSpace: 'pre',
            tabSize: 2,
          }}
        />
      </div>

      {/* Code Submission Footer */}
      <div
        style={{
          background: '#090D16',
          borderTop: '1px solid #1E293B',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          Camera proctoring is actively verifying focus while you code. Do not glance at external phones.
        </div>

        <button
          type="button"
          onClick={() => onSubmitCode(code)}
          disabled={disabled || !code.trim()}
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: disabled || !code.trim() ? 'not-allowed' : 'pointer',
            opacity: disabled || !code.trim() ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Play size={14} />
          <span>Submit Code to HR</span>
        </button>
      </div>
    </div>
  );
}
