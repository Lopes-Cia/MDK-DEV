export function PromoBannerBlock({ text, variant }: { text?: string; variant?: "hot" | "soft" }) {
  const classes =
    variant === "hot"
      ? "border-destructive/30 bg-destructive/10 text-foreground"
      : "border-border bg-muted text-foreground";

  return (
    <section className={`rounded-xl border p-4 ${classes}`}>
      <div className="text-sm font-medium">{text ?? "Promoções do dia"}</div>
    </section>
  );
}

