"use client";

import { motion } from "motion/react";
import type { Project } from "@/content/projects";

export function ProjectCard({ project }: { project: Project }) {
  const href = project.href ?? project.repo;

  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/60"
      >
        <h3 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-accent-2">
          {project.title}
        </h3>
        <p className="mt-2 flex-1 text-muted">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-muted">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </a>
    </motion.div>
  );
}
