import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  const links = [
    { label: "GitHub", href: site.github, text: site.github.replace("https://", "") },
    site.linkedin && { label: "LinkedIn", href: site.linkedin, text: site.linkedin.replace("https://", "") },
    site.email && { label: "Email", href: `mailto:${site.email}`, text: site.email },
  ].filter((l): l is { label: string; href: string; text: string } => Boolean(l));

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-32">
      <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
      <div className="max-w-2xl">
        <p className="mt-3 text-muted">Want to talk about a project, an idea or a post? Get in touch.</p>
        <ul className="mt-10 space-y-3">
          {links.map((link, i) => (
            <Reveal key={link.label} delay={i * 0.06}>
              <li>
                <a
                  href={link.href}
                  className="group flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent/60"
                >
                  <span className="font-mono text-sm text-muted">{link.label}</span>
                  <span className="transition-colors group-hover:text-accent-2">{link.text} →</span>
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  );
}
