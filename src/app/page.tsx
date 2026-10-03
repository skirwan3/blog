import Link from "next/link";
import { ContentCard } from "@/components/ContentCard";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-sm text-muted transition-colors hover:text-foreground">
        {linkLabel}
      </Link>
    </Reveal>
  );
}

export default async function Home() {
  const [projects, posts] = await Promise.all([getAllProjects(), getAllPosts()]);

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <SectionHeader title="Selected Projects" href="/projects" linkLabel="All projects →" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.slice(0, 4).map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <ContentCard
                href={`/projects/${p.slug}`}
                title={p.title}
                description={p.description}
                cover={p.cover}
                compact
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <SectionHeader title="Recent Writing" href="/blog" linkLabel="All writing →" />
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.slice(0, 4).map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <ContentCard
                href={`/blog/${p.slug}`}
                title={p.title}
                description={p.description}
                tags={p.tags}
                cover={p.cover}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
