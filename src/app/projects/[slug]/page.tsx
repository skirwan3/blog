import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/post-types";
import { getProject, getProjectSlugs } from "@/lib/projects";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getProjectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getProject(slug);
  return { title: meta.title, description: meta.description };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const { Content, meta } = await getProject(slug);

  return (
    <article className="mx-auto max-w-2xl px-6 pb-16 pt-32">
      <Link href="/projects" className="text-sm text-muted transition-colors hover:text-foreground">
        ← All projects
      </Link>
      <header className="mb-8 mt-6">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
          <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          {meta.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">{meta.title}</h1>
        <p className="mt-3 text-lg text-muted">{meta.description}</p>
        {meta.role && <p className="mt-1 text-sm text-muted">{meta.role}</p>}
        {meta.links && meta.links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {meta.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-accent/60 hover:text-accent-2"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </header>
      {/* eslint-disable-next-line @next/next/no-img-element -- variable-size source images, optimized later */}
      <img
        src={meta.cover}
        alt=""
        className="w-full rounded-xl border border-border"
      />
      <div className="post-body">
        <Content />
      </div>
    </article>
  );
}
