export function Callout({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="my-8 rounded-xl border border-accent/40 bg-accent/10 p-5">
      {title && <p className="mb-1 font-mono text-sm font-semibold text-accent-2">{title}</p>}
      <div className="text-foreground/90 [&>p]:my-0">{children}</div>
    </aside>
  );
}
