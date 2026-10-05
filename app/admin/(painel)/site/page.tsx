import { getAdminContent } from "@/lib/content-store";
import { updateHeroAction, updateSiteAction } from "../../actions";
import { HeroTagsField } from "../../hero-tags-field";
import { AdminForm, Card, CampoTexto, Field, SaveButton, inputClass } from "../../_ui";

export default async function TextosDoSite() {
  const { hero, site } = await getAdminContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Textos e contato</h1>
        <p className="mt-2 text-ink-soft">A frase de entrada da página inicial, o WhatsApp e o Instagram do ateliê.</p>
      </div>

      <Card titulo="Boas-vindas" descricao="O que aparece em cima das fotos, logo que alguém abre o site.">
        <div className="mb-6 overflow-hidden rounded-xl bg-espresso px-6 py-8 text-center text-paper">
          <p className="text-xs text-paper/60">Como fica no site</p>
          <p className="mt-2 font-serif text-2xl font-semibold tracking-tight">Bem-vindo ao {hero.titulo}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-paper/80">{hero.subtitulo}</p>
        </div>
        <AdminForm action={updateHeroAction} className="space-y-5">
          <Field label={'Nome depois de "Bem-vindo ao"'}>
            <CampoTexto name="titulo" defaultValue={hero.titulo} max={60} />
          </Field>
          <Field label="Frase de apoio" dica="Fica embaixo do nome.">
            <CampoTexto name="subtitulo" defaultValue={hero.subtitulo} max={200} linhas={3} />
          </Field>
          <HeroTagsField initialTags={hero.tags} />
          <SaveButton />
        </AdminForm>
      </Card>

      <Card titulo="Contato e Google" descricao="Usados nos botões de WhatsApp, no rodapé e na prévia do site no Google.">
        <AdminForm action={updateSiteAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp" dica="Só números: 55 + DDD + número.">
              <input name="whatsappNumero" defaultValue={site.whatsappNumero} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Instagram" dica="Sem o @.">
              <div className="flex items-center rounded-lg border border-line bg-paper focus-within:border-wood focus-within:ring-4 focus-within:ring-rattan/20">
                <span className="pl-3.5 text-ink-soft">@</span>
                <input name="instagramHandle" defaultValue={site.instagramHandle} className="w-full bg-transparent px-1.5 py-2.5 text-[0.95rem] text-ink outline-none" />
              </div>
            </Field>
          </div>
          <Field label="Nome do site">
            <CampoTexto name="nome" defaultValue={site.nome} max={40} />
          </Field>
          <Field label="Descrição para o Google" dica="O texto que aparece embaixo do link do site numa pesquisa. Até uns 160 caracteres fica inteiro.">
            <CampoTexto name="descricao" defaultValue={site.descricao} max={300} linhas={3} />
          </Field>
          <SaveButton />
        </AdminForm>
      </Card>
    </div>
  );
}
