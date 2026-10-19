import { ChairBuilder } from "@/components/chair-builder";
import { getAdminContent } from "@/lib/content-store";

// "Montar e publicar" (2026-10-19, user: "fazer uma trama e escolher mandar
// para o painel... time, boho, desenhos"): the site's Monte a sua trama; its
// last step publishes the chair as a new model in the chosen collection.

export default async function Montar() {
  const content = await getAdminContent();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Montar e publicar</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Monte uma cadeira igual o cliente monta no site. No último passo, dê um nome, escolha a coleção (Times, Boho, Desenhos ou
          Cadeiras) e publique: ela entra no site com a imagem montada como foto e ganha página própria.
        </p>
      </div>
      <div className="rounded-2xl border border-line/70 bg-canvas p-3 sm:p-6">
        <ChairBuilder whatsappNumero={content.site.whatsappNumero} painel />
      </div>
    </div>
  );
}
