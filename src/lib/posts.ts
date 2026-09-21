import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Post, PostMeta } from "./post-types";

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

export async function getPostSlugs(): Promise<string[]> {
  const files = await readdir(POSTS_DIR);
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getPost(slug: string) {
  const mod = await import(`@/content/posts/${slug}.mdx`);
  return { Content: mod.default, meta: mod.metadata as PostMeta };
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => ({ slug, ...(await getPost(slug)).meta })),
  );
  return posts.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
