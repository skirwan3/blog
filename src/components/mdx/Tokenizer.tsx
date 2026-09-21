"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const colors = ["bg-accent/25", "bg-accent-2/25", "bg-emerald-400/25", "bg-amber-400/25"];

/** Toy word/punctuation splitter — an example of an interactive component embedded in a post. */
export function Tokenizer({ initial = "Interactive posts make ideas click." }: { initial?: string }) {
  const [text, setText] = useState(initial);
  const tokens = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];

  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-surface p-5">
      <label className="mb-2 block font-mono text-xs text-muted" htmlFor="tokenizer-input">
        Type something
      </label>
      <input
        id="tokenizer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-accent"
      />
      <div className="mt-4 flex min-h-10 flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {tokens.map((t, i) => (
            <motion.span
              key={`${i}-${t}`}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className={`rounded-md px-2 py-1 font-mono text-sm ${colors[i % colors.length]}`}
            >
              {t}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 font-mono text-xs text-muted">{tokens.length} tokens</p>
    </div>
  );
}
