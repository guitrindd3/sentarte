import { PageHeader } from "@/components/page-header";
import { TextoRico, textoSimples } from "@/components/texto-rico";
import type { Bloco } from "@/lib/textos-paginas";

/** Policy-style page (envio, trocas, privacidade, termos): title, optional intro, titled sections. */
export function PaginaDeTexto({
  titulo,
  intro,
  secoes,
  whatsappNumero,
  nome,
}: {
  titulo: string;
  intro?: string;
  secoes: Bloco[];
  whatsappNumero: string;
  nome: string;
}) {
  return (
    <>
      <PageHeader titulo={textoSimples(titulo, nome)} />
      <section className="mx-auto max-w-6xl space-y-6 px-6 py-16 [&>*]:max-w-3xl text-sm leading-relaxed text-ink-soft">
        {intro ? (
          <div className="space-y-3">
            <TextoRico texto={intro} whatsappNumero={whatsappNumero} nome={nome} />
          </div>
        ) : null}
        {secoes.map((s, i) => (
          <div key={i}>
            {s.titulo ? <h2 className="font-serif text-lg text-ink">{textoSimples(s.titulo, nome)}</h2> : null}
            <div className="mt-2 space-y-3">
              <TextoRico texto={s.texto} whatsappNumero={whatsappNumero} nome={nome} />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
