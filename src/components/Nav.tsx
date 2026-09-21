"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const links = [
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
          <span className="text-gradient">skirwan</span>
          <span className="text-muted">.dev</span>
        </Link>
        <ul className="flex gap-1">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href} className="relative">
                <Link
                  href={href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[13px] h-px bg-gradient-to-r from-accent to-accent-2"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
