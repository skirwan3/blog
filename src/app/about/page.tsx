import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Data scientist with a background in neuroscience and healthcare analytics, interested in applying machine learning and AI to real problems.",
};

const intro =
  "I'm a data scientist with a background in neuroscience and healthcare analytics, and I'm most interested in how machine learning and AI can be applied to solve real problems.";

const paragraphs = [
  "My path into data started in the lab. I studied psychology and neuroscience at the University of Florida, then spent two years as a research fellow at the National Institutes of Health, where I worked on studies of adolescent depression and the long-term effects of infectious disease. This research background shaped the principles I aim to bring to data problems: understanding context first, asking good questions, analyzing data carefully, and communicating clearly.",
  "Since then, I've applied data science across healthcare and industry, building predictive models for patient risk, forecasting and pricing problems, and analytics that help organizations become more efficient and make better decisions. I earned my M.S. in Analytics from Georgia Tech, completing the Computational Data Analytics track, which focused on the mathematics and computation underlying machine learning and artificial intelligence.",
  "While my day-to-day work focuses on advancing organizations' data capabilities, I use this site to explore the topics in ML and AI I'm most curious about. Here I write about what I'm learning and think through where modern methods can help with problems in health and science.",
  "Outside of this work, I enjoy mentoring Georgia Tech graduate students, and I'm always happy to talk with others working in data science, healthcare, or applied AI.",
];

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-32">
      <h1 className="text-4xl font-semibold tracking-tight">About Me</h1>

      <Reveal>
        <p className="mt-8 text-xl leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
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
  );
}
