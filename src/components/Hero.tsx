"use client";

import { motion } from "motion/react";

const headline = ["Stuart", "Kirwan"];

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
      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-28 sm:pb-24 sm:pt-40">
        <h1 className="max-w-3xl text-5xl font-semibold text-white leading-[1.05] tracking-tight sm:text-7xl">
          {headline.map((word, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block"
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
          Data science projects, interactive explainers and writing on machine
          learning, AI and healthcare analytics.
        </motion.p>
      </div>
    </section>
  );
}
