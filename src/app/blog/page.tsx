import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
      <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-3 text-muted">Writing on technology, projects and ideas.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {posts.map((post, i) => (
          <Reveal key={post.slug} delay={i * 0.06}>
            <PostCard post={post} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
