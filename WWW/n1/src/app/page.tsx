export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">POC E-commerce Multi-tenant</h1>
      <p className="text-sm text-muted-foreground">
        Abra um tenant via subdomínio em localhost (lvh.me) ou via path.
      </p>
      <div className="grid gap-2 text-sm">
        <a className="underline underline-offset-4" href="http://adega-lopes.lvh.me:3000/">
          adega-lopes.lvh.me:3000
        </a>
        <a className="underline underline-offset-4" href="http://mercearia-lopes.lvh.me:3000/">
          mercearia-lopes.lvh.me:3000
        </a>
        <a className="underline underline-offset-4" href="http://localhost:3000/adega-lopes">
          localhost:3000/adega-lopes
        </a>
        <a className="underline underline-offset-4" href="http://localhost:3000/mercearia-lopes">
          localhost:3000/mercearia-lopes
        </a>
      </div>
    </main>
  );
}
