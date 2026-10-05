import Link from "next/link";

export function AbasAcessos({ atual }: { atual: "resumo" | "visitas" }) {
  const abas = [
    { id: "resumo", href: "/admin/acessos", rotulo: "Resumo" },
    { id: "visitas", href: "/admin/acessos/visitas", rotulo: "Visita por visita" },
  ];
  return (
    <div className="mt-4 flex gap-1 border-b border-line">
      {abas.map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
            a.id === atual ? "border-wood text-ink" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {a.rotulo}
        </Link>
      ))}
    </div>
  );
}
