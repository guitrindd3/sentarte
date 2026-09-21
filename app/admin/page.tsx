import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getContent } from "@/lib/content-store";
import {
  addCategoriaAction,
  addModeloAction,
  deleteCategoriaAction,
  deleteModeloAction,
  logoutAction,
  updateCategoriaAction,
  updateHeroAction,
  updateModeloAction,
  updateSiteAction,
} from "./actions";
import { ConfirmSubmitButton, Field, SaveButton, btnClass, inputClass } from "./_ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await verifySession())) redirect("/admin/login");
  const content = await getContent();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Painel do Sentarte</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Alterações aparecem no site assim que você salva.
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-ink-soft underline hover:text-ink">
            Sair
          </button>
        </form>
      </div>

      <section className="mt-10 border border-line bg-paper p-6">
        <h2 className="font-serif text-xl text-ink">Boas-vindas (carrossel de entrada)</h2>
        <form action={updateHeroAction} className="mt-4 space-y-4">
          <Field label={'Nome depois de "Bem-vindo ao"'}>
            <textarea name="titulo" defaultValue={content.hero.titulo} rows={2} className={inputClass} />
          </Field>
          <Field label="Texto de apoio (abaixo do nome)">
            <textarea name="subtitulo" defaultValue={content.hero.subtitulo} rows={3} className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            {content.hero.tags.map((tag, i) => (
              <Field key={i} label={`Selo ${i + 1}`}>
                <input name={`tag${i}`} defaultValue={tag} className={inputClass} />
              </Field>
            ))}
          </div>
          <SaveButton />
        </form>
      </section>

      <section className="mt-8 border border-line bg-paper p-6">
        <h2 className="font-serif text-xl text-ink">Configurações do site</h2>
        <form action={updateSiteAction} className="mt-4 space-y-4">
          <Field label="Nome do site">
            <input name="nome" defaultValue={content.site.nome} className={inputClass} />
          </Field>
          <Field label="Descrição (usada no Google e nas prévias de link)">
            <textarea name="descricao" defaultValue={content.site.descricao} rows={2} className={inputClass} />
          </Field>
          <Field label="WhatsApp (só números, com código do país: 55...)">
            <input name="whatsappNumero" defaultValue={content.site.whatsappNumero} className={inputClass} />
          </Field>
          <Field label="Instagram (sem @)">
            <input name="instagramHandle" defaultValue={content.site.instagramHandle} className={inputClass} />
          </Field>
          <SaveButton />
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Categorias</h2>
        <form action={addCategoriaAction} className="mt-4 flex flex-wrap gap-2 border border-dashed border-rattan p-4">
          <input name="titulo" placeholder="Nome da nova categoria" required className={`flex-1 ${inputClass}`} />
          <button type="submit" className={btnClass}>
            Adicionar categoria
          </button>
        </form>

        <div className="mt-6 space-y-8">
          {content.categorias.map((cat) => (
            <div key={cat.id} className="border border-line bg-paper p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-serif text-lg text-ink">{cat.titulo}</p>
                <form action={deleteCategoriaAction.bind(null, cat.id)}>
                  <ConfirmSubmitButton
                    confirmText={`Excluir a categoria "${cat.titulo}" e todos os seus modelos?`}
                    className="text-sm text-clay hover:underline"
                  >
                    Excluir categoria
                  </ConfirmSubmitButton>
                </form>
              </div>

              <form action={updateCategoriaAction.bind(null, cat.id)} className="mt-4 space-y-4">
                <Field label="Nome">
                  <input name="titulo" defaultValue={cat.titulo} className={inputClass} />
                </Field>
                <Field label="Resumo (aparece na home)">
                  <input name="resumo" defaultValue={cat.resumo} className={inputClass} />
                </Field>
                <Field label="Descrição completa (aparece na página da categoria)">
                  <textarea name="intro" defaultValue={cat.intro} rows={2} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cor 1 do quadro">
                    <input type="color" name="corA" defaultValue={cat.corA} className="h-10 w-full" />
                  </Field>
                  <Field label="Cor 2 do quadro">
                    <input type="color" name="corB" defaultValue={cat.corB} className="h-10 w-full" />
                  </Field>
                </div>
                <SaveButton />
              </form>

              <div className="mt-6 border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">Modelos</p>
                <div className="mt-3 space-y-4">
                  {cat.modelos.map((m) => (
                    <div key={m.id} className="border border-line p-4">
                      <form
                        action={updateModeloAction.bind(null, cat.id, m.id)}
                        encType="multipart/form-data"
                        className="space-y-3"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Nome">
                            <input name="nome" defaultValue={m.nome} className={inputClass} />
                          </Field>
                          <Field label="Foto">
                            <input type="file" name="foto" accept="image/*" className="text-sm text-ink-soft" />
                            {m.imagemUrl ? (
                              <label className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                                <input type="checkbox" name="removerFoto" /> remover foto atual
                              </label>
                            ) : null}
                          </Field>
                        </div>
                        <Field label="Descrição">
                          <textarea name="descricao" defaultValue={m.descricao} rows={2} className={inputClass} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Cor 1 (usada se não tiver foto)">
                            <input type="color" name="corA" defaultValue={m.corA} className="h-10 w-full" />
                          </Field>
                          <Field label="Cor 2 (usada se não tiver foto)">
                            <input type="color" name="corB" defaultValue={m.corB} className="h-10 w-full" />
                          </Field>
                        </div>
                        <SaveButton />
                      </form>
                      <form action={deleteModeloAction.bind(null, cat.id, m.id)} className="mt-3">
                        <ConfirmSubmitButton
                          confirmText={`Excluir o modelo "${m.nome}"?`}
                          className="text-xs text-clay hover:underline"
                        >
                          Excluir modelo
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
                <form
                  action={addModeloAction.bind(null, cat.id)}
                  className="mt-4 flex flex-wrap gap-2 border border-dashed border-rattan p-3"
                >
                  <input name="nome" placeholder="Nome do novo modelo" required className={`flex-1 ${inputClass}`} />
                  <button type="submit" className={btnClass}>
                    Adicionar modelo
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
