"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatDate, type Post } from "@/lib/post-types";

export function PostCard({ post }: { post: Post }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/60"
      >
        <div className="mb-3 flex items-center gap-3 font-mono text-xs text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.tags?.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-accent-2">
          {post.title}
        </h3>
        <p className="mt-2 text-muted">{post.description}</p>
        <span className="mt-4 inline-block text-sm text-accent transition-transform group-hover:translate-x-1">
          Read post →
        </span>
      </Link>
    </motion.div>
  );
}
