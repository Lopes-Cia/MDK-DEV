export function HeroBlock({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
    </section>
  );
}

