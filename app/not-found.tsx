import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-4xl text-ink">Página não encontrada</h1>
      <p className="mt-3 text-ink-soft">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="mt-8 border border-ink px-6 py-3 text-sm text-ink transition-colors hover:bg-ink hover:text-canvas"
      >
        Voltar para a home
      </Link>
    </div>
  );
}
