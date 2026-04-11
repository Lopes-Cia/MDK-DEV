export function Footer({ tenantName }: { tenantName: string }) {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 text-xs text-muted-foreground">
        {tenantName}
      </div>
    </footer>
  );
}

