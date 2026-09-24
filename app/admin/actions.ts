"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { createSession, destroySession, verifyPassword, verifySession } from "@/lib/auth";
import { getContentForWrite, saveContent } from "@/lib/content-store";
import type { Categoria, Modelo } from "@/lib/content-schema";

type LoginState = { error?: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password || !verifyPassword(password)) {
    return { error: "Senha incorreta." };
  }
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await verifySession())) redirect("/admin/login");
}

function slugify(text: string) {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    // Strips combining accent marks left behind by NFD normalization
    // (all non-ASCII at this point), e.g. "ç" -> "c", "ã" -> "a".
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "categoria";
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

export async function updateHeroAction(formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  content.hero.titulo = String(formData.get("titulo") ?? content.hero.titulo);
  content.hero.subtitulo = String(formData.get("subtitulo") ?? content.hero.subtitulo);
  const tags: string[] = [];
  for (let i = 0; formData.has(`tag${i}`); i++) {
    const value = String(formData.get(`tag${i}`) ?? "").trim();
    if (value) tags.push(value);
  }
  content.hero.tags = tags;
  await saveContent(content);
  revalidateSite();
}

export async function updateSiteAction(formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  content.site.nome = String(formData.get("nome") ?? content.site.nome);
  content.site.descricao = String(formData.get("descricao") ?? content.site.descricao);
  content.site.whatsappNumero = String(formData.get("whatsappNumero") ?? content.site.whatsappNumero).replace(
    /\D/g,
    ""
  );
  content.site.instagramHandle = String(formData.get("instagramHandle") ?? content.site.instagramHandle).replace(
    /^@/,
    ""
  );
  await saveContent(content);
  revalidateSite();
}

export async function addCategoriaAction(formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  const titulo = String(formData.get("titulo") ?? "Nova categoria").trim() || "Nova categoria";

  let slug = slugify(titulo);
  let n = 2;
  while (content.categorias.some((c) => c.slug === slug)) {
    slug = `${slugify(titulo)}-${n++}`;
  }

  const nova: Categoria = {
    id: crypto.randomUUID(),
    slug,
    titulo,
    resumo: "",
    intro: "",
    corA: "#15564C",
    corB: "#BD502E",
    modelos: [],
  };
  content.categorias.push(nova);
  await saveContent(content);
  revalidateSite();
}

export async function updateCategoriaAction(categoriaId: string, formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  const cat = content.categorias.find((c) => c.id === categoriaId);
  if (!cat) return;

  cat.titulo = String(formData.get("titulo") ?? cat.titulo);
  cat.resumo = String(formData.get("resumo") ?? cat.resumo);
  cat.intro = String(formData.get("intro") ?? cat.intro);
  cat.corA = String(formData.get("corA") ?? cat.corA);
  cat.corB = String(formData.get("corB") ?? cat.corB);

  await saveContent(content);
  revalidateSite();
}

export async function deleteCategoriaAction(categoriaId: string) {
  await requireAdmin();
  const content = await getContentForWrite();
  content.categorias = content.categorias.filter((c) => c.id !== categoriaId);
  await saveContent(content);
  revalidateSite();
}

export async function addModeloAction(categoriaId: string, formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  const cat = content.categorias.find((c) => c.id === categoriaId);
  if (!cat) return;

  const novo: Modelo = {
    id: crypto.randomUUID(),
    nome: String(formData.get("nome") ?? "Novo modelo").trim() || "Novo modelo",
    descricao: "",
    corA: "#15564C",
    corB: "#BD502E",
  };
  cat.modelos.push(novo);
  await saveContent(content);
  revalidateSite();
}

export async function updateModeloAction(categoriaId: string, modeloId: string, formData: FormData) {
  await requireAdmin();
  const content = await getContentForWrite();
  const cat = content.categorias.find((c) => c.id === categoriaId);
  const modelo = cat?.modelos.find((m) => m.id === modeloId);
  if (!cat || !modelo) return;

  modelo.nome = String(formData.get("nome") ?? modelo.nome);
  modelo.descricao = String(formData.get("descricao") ?? modelo.descricao);
  modelo.corA = String(formData.get("corA") ?? modelo.corA);
  modelo.corB = String(formData.get("corB") ?? modelo.corB);

  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const blob = await put(`modelos/${crypto.randomUUID()}-${foto.name}`, foto, {
      access: "public",
      contentType: foto.type || undefined,
    });
    modelo.imagemUrl = blob.url;
  }
  if (formData.get("removerFoto") === "on") {
    modelo.imagemUrl = undefined;
  }

  const variantes: (string | undefined)[] = [...(modelo.variantes ?? [])];
  const camposVariante = [2, 3, 4, 5, 6].map((n) => ({
    foto: `fotoVariante${n}`,
    remover: `removerVariante${n}`,
  }));
  for (const [i, { foto: campoFoto, remover: campoRemover }] of camposVariante.entries()) {
    const fotoVariante = formData.get(campoFoto);
    if (fotoVariante instanceof File && fotoVariante.size > 0) {
      const blob = await put(`modelos/${crypto.randomUUID()}-${fotoVariante.name}`, fotoVariante, {
        access: "public",
        contentType: fotoVariante.type || undefined,
      });
      variantes[i] = blob.url;
    } else if (formData.get(campoRemover) === "on") {
      variantes[i] = undefined;
    }
  }
  modelo.variantes = variantes.filter((v): v is string => Boolean(v));

  await saveContent(content);
  revalidateSite();
}

export async function deleteModeloAction(categoriaId: string, modeloId: string) {
  await requireAdmin();
  const content = await getContentForWrite();
  const cat = content.categorias.find((c) => c.id === categoriaId);
  if (!cat) return;
  cat.modelos = cat.modelos.filter((m) => m.id !== modeloId);
  await saveContent(content);
  revalidateSite();
}
