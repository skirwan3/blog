export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-sm text-muted">
        <span>© {new Date().getFullYear()} Stuart Kirwan</span>
        <a
          href="https://github.com/skirwan3"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
