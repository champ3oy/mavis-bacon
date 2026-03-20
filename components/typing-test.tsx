"use client";

import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Keyboard } from "@/components/ui/keyboard";
import type { KeyboardInteractionEvent, KeyboardThemeName } from "@/components/ui/keyboard";
import { generateWords } from "@/lib/words";

// --- Reducer ---
interface State {
  words: string[];
  wordIndex: number;
  input: string;
  completed: string[];
  started: boolean;
  startTime: number | null;
  endTime: number | null;
}

type Action =
  | { type: "INIT"; words: string[] }
  | { type: "CHAR"; char: string }
  | { type: "BACKSPACE" }
  | { type: "SPACE" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return { words: action.words, wordIndex: 0, input: "", completed: [], started: true, startTime: null, endTime: null };
    case "CHAR": {
      if (state.wordIndex >= state.words.length) return state;
      const now = state.startTime ?? Date.now();
      return { ...state, input: state.input + action.char, startTime: now };
    }
    case "BACKSPACE":
      if (state.input.length === 0) return state;
      return { ...state, input: state.input.slice(0, -1) };
    case "SPACE": {
      if (state.input.length === 0 || state.wordIndex >= state.words.length) return state;
      const now = state.startTime ?? Date.now();
      const newIndex = state.wordIndex + 1;
      return {
        ...state,
        completed: [...state.completed, state.input],
        input: "",
        wordIndex: newIndex,
        startTime: now,
        endTime: newIndex >= state.words.length ? Date.now() : null,
      };
    }
    default:
      return state;
  }
}

const THEMES: KeyboardThemeName[] = ["classic", "mint", "royal", "dolch", "sand", "scarlet"];

interface Result {
  wpm: number;
  accuracy: number;
  errors: number;
  time: string;
  date: string;
}

function loadHistory(): Result[] {
  try {
    return JSON.parse(localStorage.getItem("typing-history") || "[]");
  } catch { return []; }
}

function saveResult(result: Result) {
  const history = loadHistory();
  history.push(result);
  localStorage.setItem("typing-history", JSON.stringify(history));
}

function loadTheme(): KeyboardThemeName {
  try {
    const t = localStorage.getItem("typing-theme") as KeyboardThemeName | null;
    return t && THEMES.includes(t) ? t : "classic";
  } catch { return "classic"; }
}

// --- Component ---
export function TypingTest() {
  const [theme, setTheme] = useState<KeyboardThemeName>("classic");
  const [history, setHistory] = useState<Result[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultSaved = useRef(false);

  // Load theme and history from localStorage on mount
  useEffect(() => {
    setTheme(loadTheme());
    setHistory(loadHistory());
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    words: [],
    wordIndex: 0,
    input: "",
    completed: [],
    started: false,
    startTime: null,
    endTime: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Generate words client-side only
  useEffect(() => {
    dispatch({ type: "INIT", words: generateWords(50) });
  }, []);

  // Scroll active word into view only when it moves to a new line
  const lastScrollTop = useRef(0);
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const targetTop = activeWordRef.current.offsetTop - 8;
      if (targetTop !== lastScrollTop.current) {
        lastScrollTop.current = targetTop;
        containerRef.current.scrollTop = targetTop;
      }
    }
  }, [state.wordIndex]);

  // Physical keyboard handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;

      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "SPACE" });
        return;
      }
      if (e.code === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
        return;
      }
      if (e.code.startsWith("Key")) {
        dispatch({ type: "CHAR", char: e.code.slice(3).toLowerCase() });
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Virtual keyboard click handler
  const onKeyEvent = useCallback((event: KeyboardInteractionEvent) => {
    if (event.phase !== "down" || event.source !== "pointer") return;
    if (event.code === "Space") {
      dispatch({ type: "SPACE" });
    } else if (event.code === "Backspace") {
      dispatch({ type: "BACKSPACE" });
    } else if (event.code.startsWith("Key")) {
      dispatch({ type: "CHAR", char: event.code.slice(3).toLowerCase() });
    }
  }, []);

  const reset = useCallback(() => {
    resultSaved.current = false;
    dispatch({ type: "INIT", words: generateWords(50) });
  }, []);

  const isComplete = state.started && state.wordIndex >= state.words.length;

  if (!state.started) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-12 px-8 py-12">
      <div className="w-full max-w-3xl">
        {isComplete ? (
          <div className="text-center text-zinc-700 font-mono text-2xl space-y-4">
            <p>Done! Press the button below to restart.</p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 rounded text-zinc-700 transition-colors"
            >
              Restart
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative h-[180px] overflow-hidden font-mono text-3xl leading-[60px] tracking-wide"
          >
            <div className="flex flex-wrap">
              {state.words.map((word, wi) => {
                const isCurrent = wi === state.wordIndex;
                const isCompleted = wi < state.wordIndex;

                // Render all words with identical per-character spans to prevent reflow
                const chars: React.ReactNode[] = [];

                if (isCurrent) {
                  // Insert cursor before the character at input.length position
                  const cursor = (
                    <span
                      key="cursor"
                      className="inline-block w-[2px] h-[1.2em] bg-amber-500 animate-blink align-middle -mx-px"
                    />
                  );
                  word.split("").forEach((ch, ci) => {
                    if (ci === state.input.length) chars.push(cursor);
                    const typed = state.input[ci];
                    let cls = "text-zinc-300";
                    if (typed !== undefined) {
                      cls = typed === ch ? "text-zinc-800" : "text-red-500";
                    }
                    chars.push(<span key={ci} className={cls}>{ch}</span>);
                  });
                  // Extra typed characters beyond word length
                  if (state.input.length > word.length) {
                    state.input.slice(word.length).split("").forEach((c, i) => {
                      chars.push(<span key={`x${i}`} className="text-red-500/60">{c}</span>);
                    });
                  }
                  // Cursor at end if typed past or equal to word length
                  if (state.input.length >= word.length) chars.push(cursor);
                } else if (isCompleted) {
                  const ok = state.completed[wi] === word;
                  const cls = ok ? "text-zinc-800" : "text-red-500";
                  word.split("").forEach((ch, ci) => {
                    chars.push(<span key={ci} className={cls}>{ch}</span>);
                  });
                } else {
                  word.split("").forEach((ch, ci) => {
                    chars.push(<span key={ci} className="text-zinc-300">{ch}</span>);
                  });
                }

                return (
                  <span
                    key={wi}
                    ref={isCurrent ? activeWordRef : undefined}
                    className="mr-[0.75ch]"
                  >
                    {chars}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Keyboard
        theme={theme}
        enableSound={true}
        enableHaptics={false}
        onKeyEvent={onKeyEvent}
      />

      <div className="flex items-center gap-6 text-xs text-zinc-400 font-mono">
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => { setTheme(t); localStorage.setItem("typing-theme", t); }}
            className={`transition-colors ${t === theme ? "text-zinc-700" : "text-zinc-300 hover:text-zinc-400"}`}
          >
            {t}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`transition-colors ${showHistory ? "text-zinc-700" : "text-zinc-300 hover:text-zinc-400"}`}
        >
          history
        </button>
      </div>

      {isComplete && state.startTime && state.endTime && (() => {
        const elapsed = (state.endTime - state.startTime) / 1000;
        const minutes = elapsed / 60;
        const totalChars = state.completed.reduce((sum, w) => sum + w.length, 0);
        const wpm = Math.round((totalChars / 5) / minutes);
        const errors = state.completed.filter((input, i) => input !== state.words[i]).length;
        const accuracy = Math.round(((state.words.length - errors) / state.words.length) * 100);
        const mins = Math.floor(elapsed / 60);
        const secs = Math.round(elapsed % 60);
        const time = `${mins}:${secs.toString().padStart(2, "0")}`;

        if (!resultSaved.current) {
          resultSaved.current = true;
          const result: Result = { wpm, accuracy, errors, time, date: new Date().toLocaleDateString() };
          saveResult(result);
          setHistory(loadHistory());
        }

        return (
          <div className="flex items-center gap-6 text-xs text-zinc-400 font-mono">
            <span>{wpm} WPM</span>
            <span>{accuracy}% accuracy</span>
            <span>{errors} error{errors !== 1 ? "s" : ""}</span>
            <span>{time}</span>
          </div>
        );
      })()}

      <div className="relative h-0">
        {showHistory && (
          <div className="absolute left-1/2 -translate-x-1/2 top-2 font-mono text-xs">
            {history.length > 0 ? (
              <table className="border-collapse">
                <thead>
                  <tr className="text-zinc-300">
                    <td className="pr-8 py-0.5">date</td>
                    <td className="pr-8 py-0.5 text-right">wpm</td>
                    <td className="pr-8 py-0.5 text-right">acc</td>
                    <td className="pr-8 py-0.5 text-right">errors</td>
                    <td className="py-0.5 text-right">time</td>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  {[...history].reverse().slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td className="pr-8 py-0.5">{r.date}</td>
                      <td className="pr-8 py-0.5 text-right">{r.wpm}</td>
                      <td className="pr-8 py-0.5 text-right">{r.accuracy}%</td>
                      <td className="pr-8 py-0.5 text-right">{r.errors}</td>
                      <td className="py-0.5 text-right">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-zinc-300">no results yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
