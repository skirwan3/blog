import Link from "next/link";
import { ContentCard } from "@/components/ContentCard";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";

export default async function Home() {
  const [projects, posts] = await Promise.all([getAllProjects(), getAllPosts()]);
  const items = [
    ...projects.map((p) => ({
      key: `project-${p.slug}`,
      date: p.date,
      href: `/projects/${p.slug}`,
      title: p.title,
      description: p.description,
      tags: p.tags,
      cover: p.cover,
      label: "Project",
    })),
    ...posts.map((p) => ({
      key: `post-${p.slug}`,
      date: p.date,
      href: `/blog/${p.slug}`,
      title: p.title,
      description: p.description,
      tags: p.tags,
      cover: p.cover,
      label: "Article",
    })),
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 4);

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Work &amp; Writing</h2>
          <div className="flex gap-5 text-sm text-muted">
            <Link href="/projects" className="transition-colors hover:text-foreground">
              All projects →
            </Link>
            <Link href="/blog" className="transition-colors hover:text-foreground">
              All articles →
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map(({ key, ...item }, i) => (
            <Reveal key={key} delay={i * 0.06}>
              <ContentCard {...item} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
