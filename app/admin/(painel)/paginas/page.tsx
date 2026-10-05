import Link from "next/link";
import { getAdminContent } from "@/lib/content-store";
import { PAGINAS_EDITAVEIS } from "@/lib/textos-paginas";

export default async function Paginas() {
  const { paginas } = await getAdminContent();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Páginas do site</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Escolha a página para mudar os textos. As cadeiras e as categorias ficam em Cadeiras; a frase de boas-vindas, o WhatsApp e o Instagram, em Textos e contato.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {PAGINAS_EDITAVEIS.map((p) => {
          const editada = Boolean(paginas[p.id] && Object.keys(paginas[p.id]).length);
          return (
            <li key={p.id}>
              <Link
                href={`/admin/paginas/${p.id}`}
                className="group flex h-full flex-col rounded-2xl border border-line/70 bg-paper p-5 transition hover:border-wood hover:shadow-[5px_5px_0_0_var(--rattan)]"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-serif text-xl font-medium tracking-tight text-ink group-hover:text-wood-dark">{p.nome}</span>
                  {editada ? <span className="rounded-full bg-rattan/15 px-2.5 py-0.5 text-xs font-semibold text-wood-dark">Editada</span> : null}
                </span>
                <span className="mt-1 text-sm text-ink-soft">{p.descricao}</span>
                <span className="mt-3 font-mono text-xs text-ink-soft/80">sentarte.vercel.app{p.caminho}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
