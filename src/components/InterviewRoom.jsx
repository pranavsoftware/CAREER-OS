'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CameraOff, AlertTriangle } from 'lucide-react';

const CSS = `
.ir {
  --ink: #0B1220;
  --panel: #111A2E;
  --line: #243049;
  --text: #E6EBF5;
  --muted: #94A3B8;
  --accent: #6366F1;
  --ok: #22C55E;
  --warn: #F59E0B;
  --bad: #EF4444;
  display: grid;
  gap: 12px;
  color: var(--text);
  font-family: inherit;
}

.ir-bar {
  grid-area: bar;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  background: var(--ink);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 14px;
}

.ir-bar b {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.ir-muted {
  color: var(--muted);
  font-size: 12px;
}

.ir-steps {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 120px;
  max-width: 240px;
}

.ir-steps i {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  transition: background 0.3s ease;
}

.ir-steps i[data-s="done"] {
  background: var(--ok);
}

.ir-steps i[data-s="now"] {
  background: var(--accent);
}

.ir-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #86EFAC;
}

.ir-chip[data-warn="true"] {
  background: rgba(245, 158, 11, 0.14);
  color: #FCD34D;
}

.ir-btn {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ir-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--muted);
}

.ir-btn:focus-visible,
.ir-end:focus-visible {
  outline: 2px solid #A5B4FC;
  outline-offset: 2px;
}

.ir-end {
  border: 0;
  background: #DC2626;
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ir-end:hover {
  background: #B91C1C;
}

.ir-end[data-confirm="true"] {
  background: #7F1D1D;
  box-shadow: 0 0 0 2px #FCA5A5;
}

.ir-side {
  grid-area: side;
  display: grid;
  gap: 10px;
  align-content: start;
}

.ir-tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tile {
  position: relative;
  aspect-ratio: 16/10;
  border-radius: 12px;
  overflow: hidden;
  background: var(--panel);
  border: 1px solid var(--line);
  transition: box-shadow 0.2s ease;
}

.tile[data-speaking="true"] {
  box-shadow: 0 0 0 2px var(--accent), 0 0 0 7px rgba(99, 102, 241, 0.22);
}

.tile[data-warning="true"] {
  box-shadow: 0 0 0 2px var(--warn), 0 0 0 7px rgba(245, 158, 11, 0.22);
}

.tile video,
.tile canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile video[data-mirror="true"] {
  transform: scaleX(-1);
}

.tile-name {
  position: absolute;
  left: 8px;
  bottom: 8px;
  max-width: calc(100% - 16px);
  display: flex;
  flex-direction: column;
  background: rgba(11, 18, 32, 0.78);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 4px 9px;
  z-index: 5;
}

.tile-name b {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.tile-name span {
  font-size: 11px;
  color: var(--muted);
}

.tile-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
  padding: 14px;
  font-size: 13px;
  color: var(--muted);
  background: var(--panel);
}

.ir-caption {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 7.5em;
  overflow-y: auto;
}

.ir-caption b {
  color: #A5B4FC;
  font-weight: 600;
}

.ir-work {
  grid-area: work;
  min-width: 0;
  background: #fff;
  color: #0F172A;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
}

.ir {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "bar" "side" "work";
}

@media (min-width: 1100px) {
  .ir--coding {
    grid-template-columns: minmax(0, 1fr) 340px;
    grid-template-areas: "bar bar" "work side";
  }
  .ir--coding .ir-tiles {
    grid-template-columns: 1fr;
  }
  .ir--coding .ir-side {
    position: sticky;
    top: 12px;
  }
}

@media (max-width: 640px) {
  .ir-tiles {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .tile {
    aspect-ratio: 4/5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }
}
`;

export function Tile({ name, sub, speaking, warning, children }) {
  return (
    <div className="tile" data-speaking={!!speaking} data-warning={!!warning}>
      {children}
      <div className="tile-name">
        <b>{name}</b>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/** Message shown inside a tile when the camera or avatar is not available. */
export function TileMessage({ icon: Icon = CameraOff, children }) {
  return (
    <div className="tile-msg">
      <Icon size={24} style={{ margin: '0 auto', opacity: 0.8 }} />
      <div>{children}</div>
    </div>
  );
}

export default function InterviewRoom({
  interviewer,
  avatarNode,
  selfNode,
  candidateName = 'You',
  avatarState = 'listening',
  caption = '',
  questionIndex = 0,
  total = 1,
  stage = 'Verbal Round',
  elapsed = 0,
  isCoding = false,
  proctorWarn = false,
  onEnd,
  onTestCheck,
  children,
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (!confirmEnd) return undefined;
    const id = setTimeout(() => setConfirmEnd(false), 4000);
    return () => clearTimeout(id);
  }, [confirmEnd]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const interviewerName = interviewer?.name || 'Interviewer';
  const interviewerTitle = interviewer?.title || 'Technical HR';

  return (
    <section className={`ir ${isCoding ? 'ir--coding' : 'ir--verbal'}`} aria-label="Interview room">
      <style>{CSS}</style>

      <header className="ir-bar">
        <b>
          Question {questionIndex + 1} of {total}
        </b>
        <span className="ir-muted">{stage}</span>
        <div className="ir-steps" role="img" aria-label={`Question ${questionIndex + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} data-s={i < questionIndex ? 'done' : i === questionIndex ? 'now' : 'todo'} />
          ))}
        </div>
        <span className="ir-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} />
          {mm}:{ss}
        </span>
        <span style={{ flex: 1 }} />
        <span
          className="ir-chip"
          data-warn={!!proctorWarn}
          title="Tab changes, camera presence and gaze are logged for review. Video is not recorded."
        >
          {proctorWarn ? (
            <>
              <AlertTriangle size={13} />
              Integrity check in progress
            </>
          ) : (
            <>
              <ShieldCheck size={13} />
              Proctoring on
            </>
          )}
        </span>
        {process.env.NODE_ENV !== 'production' && onTestCheck && (
          <button type="button" className="ir-btn" onClick={onTestCheck}>
            Test hands-up check
          </button>
        )}
        <button
          type="button"
          className="ir-end"
          data-confirm={confirmEnd}
          onClick={() => (confirmEnd ? onEnd?.() : setConfirmEnd(true))}
        >
          {confirmEnd ? 'Click again to end' : 'End interview'}
        </button>
      </header>

      <div className="ir-side">
        <div className="ir-tiles">
          <Tile
            name={interviewerName}
            sub={interviewerTitle}
            speaking={avatarState === 'speaking'}
            warning={avatarState === 'warning'}
          >
            {avatarNode}
          </Tile>
          <Tile name={candidateName} warning={proctorWarn}>
            {selfNode}
          </Tile>
        </div>
        <div className="ir-caption" aria-live="polite">
          {caption ? (
            <>
              <b>{interviewerName}:</b> {caption}
            </>
          ) : (
            <span className="ir-muted">Waiting for the next question...</span>
          )}
        </div>
      </div>

      <div className="ir-work">{children}</div>
    </section>
  );
}
