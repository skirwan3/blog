import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { getAllPosts } from "@/lib/posts";

export default async function Home() {
  const posts = (await getAllPosts()).slice(0, 3);

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Reveal className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Latest writing</h2>
          <Link href="/blog" className="text-sm text-muted transition-colors hover:text-foreground">
            All posts →
          </Link>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
