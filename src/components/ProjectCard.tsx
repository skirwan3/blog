import type { Project } from "@/lib/project-types";
import { ContentCard } from "./ContentCard";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <ContentCard
      href={`/projects/${project.slug}`}
      title={project.title}
      description={project.description}
      tags={project.tags}
      cover={project.cover}
    />
  );
}
