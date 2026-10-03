export type ProjectMeta = {
  title: string;
  description: string;
  /** One short line for compact home-page tiles; falls back to description. */
  summary?: string;
  date: string;
  tags: string[];
  role?: string;
  cover: string;
  links?: { label: string; href: string }[];
};

export type Project = ProjectMeta & { slug: string };
