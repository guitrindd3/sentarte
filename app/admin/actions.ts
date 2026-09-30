"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { headers } from "next/headers";
import { createSession, destroySession, revogarTodasAsSessoes, verifyPassword, verifySession } from "@/lib/auth";
import { CONTENT_TAG, getContentForWrite, saveContent } from "@/lib/content-store";
import type { Categoria, Modelo } from "@/lib/content-schema";

type LoginState = { error?: string } | undefined;

// Brute-force brake for the single admin password: every wrong attempt waits
// a second, and an IP is locked out for 15 minutes after 5 wrong ones.
// In-memory, so it's per server instance — a speed bump, not a wall; the
// real protection is a long password.
const MAX_TENTATIVAS = 5;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, { n: number; desde: number }>();

async function ipDoPedido() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await ipDoPedido();
  const agora = Date.now();
  const reg = tentativas.get(ip);
  if (reg && agora - reg.desde > JANELA_MS) tentativas.delete(ip);
  const atual = tentativas.get(ip);
  if (atual && atual.n >= MAX_TENTATIVAS) {
    const min = Math.ceil((JANELA_MS - (agora - atual.desde)) / 60000);
    return { error: `Muitas tentativas erradas. Tente de novo em ${min} min.` };
  }

  const password = String(formData.get("password") ?? "");
  if (!password || password.length > 200 || !verifyPassword(password)) {
    tentativas.set(ip, { n: (atual?.n ?? 0) + 1, desde: atual?.desde ?? agora });
    if (tentativas.size > 5000) tentativas.clear();
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "Senha incorreta." };
  }
  tentativas.delete(ip);
  await createSession();
  redirect("/admin");
}

/** Signs out every device (the current one included). */
export async function logoutTodosAction() {
  await requireAdmin();
  await revogarTodasAsSessoes();
  await destroySession();
  redirect("/admin/login");
}

// Only real images go to the public Blob store: checked by declared type,
// size, and the file's first bytes (so a renamed .html/.svg is refused).
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
async function imagemValida(f: FormDataEntryValue | null): Promise<File | null> {
  if (!(f instanceof File) || f.size === 0 || f.size > MAX_BYTES || !TIPOS_OK.includes(f.type)) return null;
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return jpg || png || webp ? f : null;
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
  updateTag(CONTENT_TAG);
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

const MAX_FOTOS_EXTRAS = 8;

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

  const foto = await imagemValida(formData.get("foto"));
  if (foto) {
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
    const fotoVariante = await imagemValida(formData.get(campoFoto));
    if (fotoVariante) {
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

  // "Mais fotos" (fotosExtras): tick to remove, multi-file input to add.
  const remover = new Set(formData.getAll("removerExtra").map(String));
  const extras = (modelo.fotosExtras ?? []).filter((url) => !remover.has(url));
  for (const entrada of formData.getAll("fotosExtrasNovas")) {
    const nova = extras.length < MAX_FOTOS_EXTRAS ? await imagemValida(entrada) : null;
    if (!nova) continue;
    const blob = await put(`modelos/${crypto.randomUUID()}-${nova.name}`, nova, {
      access: "public",
      contentType: nova.type || undefined,
    });
    extras.push(blob.url);
  }
  modelo.fotosExtras = extras.length > 0 ? extras : undefined;

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
