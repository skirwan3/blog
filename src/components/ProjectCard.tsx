"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Project } from "@/lib/project-types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/60"
      >
        <div className="aspect-[16/9] overflow-hidden bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element -- variable-size source images, optimized later */}
          <img
            src={project.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
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
        </div>
      </Link>
    </motion.div>
  );
}
