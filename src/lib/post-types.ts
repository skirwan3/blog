export type PostMeta = {
  title: string;
  description: string;
  date: string;
  tags?: string[];
};

export type Post = PostMeta & { slug: string };

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
