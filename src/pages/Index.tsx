const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex w-fit items-center rounded-full border border-border bg-secondary px-4 py-1 text-sm text-secondary-foreground">
            Dashboard
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Seu app já está carregando.
          </h1>

          <p className="text-lg text-muted-foreground sm:text-xl">
            A tela branca foi substituída por uma página inicial funcional para você continuar a construção.
          </p>

          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-2 text-2xl font-semibold">Online</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Rota</p>
              <p className="mt-2 text-2xl font-semibold">/dashboard</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Próximo passo</p>
              <p className="mt-2 text-2xl font-semibold">Construir</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
