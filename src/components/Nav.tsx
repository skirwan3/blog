"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Me" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
      <motion.nav
        aria-label="Main"
        className="pointer-events-auto flex items-center rounded-full border border-white/10 bg-background/50 p-1 shadow-lg shadow-black/30 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Link
          href="/"
          aria-label="Home"
          className="rounded-full px-3 py-1.5 font-mono text-sm font-semibold"
        >
          <span className="text-gradient">sk</span>
        </Link>
        <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
        <ul className="flex items-center">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative block rounded-full px-2.5 py-1.5 text-[13px] transition-colors sm:px-3.5 sm:text-sm ${
                    active ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </header>
  );
}
