import Link from "next/link";
import { logoutAction } from "../../actions";

// Phone-only overflow menu (the bottom bar has room for 5 tabs).
const ITENS = [
  { href: "/admin/cupons", titulo: "Cupons", texto: "Códigos de desconto para o carrinho." },
  { href: "/admin/depoimentos", titulo: "Depoimentos", texto: "Elogios de clientes na página inicial." },
  { href: "/admin/site", titulo: "Textos e contato", texto: "Boas-vindas, WhatsApp, Instagram e Google." },
  { href: "/admin/seguranca", titulo: "Segurança", texto: "Código no celular e histórico de entradas." },
];

export default function Mais() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Mais</h1>
      <ul className="space-y-3">
        {ITENS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block rounded-2xl border border-line/70 bg-paper p-4 hover:border-wood">
              <span className="block font-semibold text-ink">{i.titulo}</span>
              <span className="block text-sm text-ink-soft">{i.texto}</span>
            </Link>
          </li>
        ))}
        <li>
          <a href="/" target="_blank" rel="noreferrer" className="block rounded-2xl border border-line/70 bg-paper p-4 hover:border-wood">
            <span className="block font-semibold text-ink">Abrir o site</span>
            <span className="block text-sm text-ink-soft">Ver como o cliente vê.</span>
          </a>
        </li>
      </ul>
      <form action={logoutAction}>
        <button type="submit" className="text-sm font-medium text-clay underline-offset-2 hover:underline">
          Sair do painel
        </button>
      </form>
    </div>
  );
}
