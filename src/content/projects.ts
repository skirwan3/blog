export type Project = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  repo?: string;
};

// Placeholder entry: replace with real projects.
export const projects: Project[] = [
  {
    slug: "example-project",
    title: "Your first project",
    description: "Placeholder. Replace this with a short description of what you built and why it matters.",
    tags: ["python", "data"],
    repo: "https://github.com/skirwan3",
  },
];
