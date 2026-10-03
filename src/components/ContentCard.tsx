"use client";

import Link from "next/link";
import { motion } from "motion/react";

export type ContentCardProps = {
  href: string;
  title: string;
  description: string;
  tags?: string[];
  cover?: string;
  /** Small badge over the image, e.g. "Project" or "Article". */
  label?: string;
  /** Smaller text and padding, no tags: for dense rows of four. */
  compact?: boolean;
};

/** Image-topped card used for projects and articles. Items without a cover get a gradient placeholder. */
export function ContentCard({ href, title, description, tags = [], cover, label, compact }: ContentCardProps) {
  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/60"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-background">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- variable-size source images, optimized later
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden
              className="relative h-full w-full bg-gradient-to-br from-accent/35 via-surface to-accent-2/25 transition-transform duration-500 group-hover:scale-105"
            >
              <div className="bg-grid absolute inset-0 opacity-60" />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-4xl text-foreground/70">
                {"</>"}
              </span>
            </div>
          )}
          {label && (
            <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
              {label}
            </span>
          )}
        </div>
        <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
          <h3
            className={`font-semibold tracking-tight transition-colors group-hover:text-accent-2 ${
              compact ? "text-base leading-snug" : "text-xl"
            }`}
          >
            {title}
          </h3>
          <p className={`mt-2 text-muted ${compact ? "line-clamp-3 text-sm leading-relaxed" : "flex-1"}`}>{description}</p>
          {!compact && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-muted">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
