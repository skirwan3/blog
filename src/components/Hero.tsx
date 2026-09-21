"use client";

import Link from "next/link";
import { motion } from "motion/react";

const headline = ["Making", "technology", "easy", "to", "understand."];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/30 blur-[120px]"
        animate={{ x: [-60, 60, -60], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-5xl px-6 pb-28 pt-24 sm:pt-36">
        <motion.p
          className="mb-6 font-mono text-sm text-accent-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {"> writing, projects & experiments"}
        </motion.p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          {headline.map((word, i) => (
            <motion.span
              key={i}
              className={`mr-[0.25em] inline-block ${
                i === headline.length - 1 ? "text-gradient" : ""
              }`}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.09, ease: "easeOut" }}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-8 max-w-xl text-lg text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          Deep dives, interactive explainers and portfolio work — built to be
          read, played with and shared.
        </motion.p>
        <motion.div
          className="mt-10 flex gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Link
            href="/blog"
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
          >
            Read the blog
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-muted"
          >
            About me
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
