import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/post-types";
import { getPost, getPostSlugs } from "@/lib/posts";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await getPost(slug);
  return { title: meta.title, description: meta.description };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { Content, meta } = await getPost(slug);

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="text-sm text-muted transition-colors hover:text-foreground">
        ← All posts
      </Link>
      <header className="mb-10 mt-6">
        <time dateTime={meta.date} className="font-mono text-xs text-muted">
          {formatDate(meta.date)}
        </time>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">{meta.title}</h1>
        <p className="mt-3 text-lg text-muted">{meta.description}</p>
      </header>
      <div className="post-body">
        <Content />
      </div>
    </article>
  );
}
