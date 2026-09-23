export type ProjectMeta = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  role?: string;
  cover: string;
  links?: { label: string; href: string }[];
};

export type Project = ProjectMeta & { slug: string };
