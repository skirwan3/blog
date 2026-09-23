import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Project, ProjectMeta } from "./project-types";

const PROJECTS_DIR = path.join(process.cwd(), "src/content/projects");

export async function getProjectSlugs(): Promise<string[]> {
  const files = await readdir(PROJECTS_DIR);
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getProject(slug: string) {
  const mod = await import(`@/content/projects/${slug}.mdx`);
  return { Content: mod.default, meta: mod.metadata as ProjectMeta };
}

export async function getAllProjects(): Promise<Project[]> {
  const slugs = await getProjectSlugs();
  const projects = await Promise.all(
    slugs.map(async (slug) => ({ slug, ...(await getProject(slug)).meta })),
  );
  return projects.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
