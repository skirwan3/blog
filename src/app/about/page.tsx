import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Data scientist with a background in neuroscience research and healthcare analytics, interested in applying machine learning and AI to real-world problems.",
};

const intro =
  "I'm a data scientist with a background in healthcare analytics and neuroscience research. I'm most interested in applying machine learning and AI to real-world problems.";

const paragraphs = [
  "My path into data started in the lab. After studying psychology and neuroscience at the University of Florida, I spent two years as a research fellow at the National Institutes of Health, working on studies of adolescent depression and the long-term effects of infectious disease.",
  "Since then, I've worked across healthcare and industry, building predictive models for patient risk, tackling forecasting and pricing problems, and developing analytics that help organizations run more efficiently and make better decisions. I also earned an M.S. in Analytics from Georgia Tech through the Computational Data Analytics track, which focused on the mathematics and computation underlying machine learning and AI.",
  "This site is where I explore the ML and AI topics I'm most curious about, writing about what I'm learning and building.",
  "I'm always happy to connect with others working in data science, healthcare, or applied AI, so feel free to reach out!",
];

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
      <h1 className="text-4xl font-semibold tracking-tight">About Me</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,42rem)_14rem] lg:justify-between lg:gap-12">
        <Reveal className="lg:order-last">
          <div className="relative w-36 sm:w-44 lg:w-full">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-accent/30 to-accent-2/20 opacity-60 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- single small static image */}
            <img
              src="/about/headshot.jpg"
              alt="Headshot of Stuart Kirwan"
              width={600}
              height={600}
              className="relative aspect-square w-full rounded-2xl border border-border object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="text-xl leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
              {intro}
            </p>
          </Reveal>

          <div className="mt-10 space-y-6 text-lg leading-8 text-muted">
            {paragraphs.map((text, i) => (
              <Reveal key={i} delay={0.05}>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
              >
                See my projects
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-muted"
              >
                Get in touch
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
