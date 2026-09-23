import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function Projects() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
      <h1 className="text-4xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-3 text-muted">Things I&apos;ve built and what I learned along the way.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i * 0.06}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
