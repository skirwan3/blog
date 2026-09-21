import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">About</h1>
      <p className="mt-6 text-lg text-muted">
        Hi, I&apos;m Stuart. This page is a placeholder — tell me what you&apos;d like to say here.
      </p>
    </div>
  );
}
