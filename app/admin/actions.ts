"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { headers } from "next/headers";
import {
  apagarPreSessao,
  createSession,
  criarPreSessao,
  destroySession,
  preSessaoValida,
  revogarTodasAsSessoes,
  verifyPassword,
  verifySession,
} from "@/lib/auth";
import { redisAtivo } from "@/lib/redis";
import {
  confirmarDoisFatores,
  conferirSegundoFator,
  contarFalha,
  desativarDoisFatores,
  doisFatoresAtivo,
  iniciarDoisFatores,
  ipDe,
  limparFalhas,
  minutosBloqueado,
  registrarEntrada,
} from "@/lib/seguranca";
import { getContentForWrite, prepararFoto, saveContent } from "@/lib/content-store";
import type { ArquivoNovo } from "@/lib/github-store";
import type { Categoria, Depoimento, Modelo } from "@/lib/content-schema";

export type LoginState = { error?: string; etapa?: "senha" | "codigo" } | undefined;

// Brute-force brake: every wrong attempt waits a second, and an IP is locked
// out for 15 minutes after 5 wrong ones (password or code). Kept in Redis
// since 2026-10-05 so every server instance shares it; in-memory fallback
// when Redis isn't configured.
const MAX_TENTATIVAS = 5;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, { n: number; desde: number }>();

async function bloqueadoPorMin(ip: string) {
  if (redisAtivo()) return minutosBloqueado(ip);
  const agora = Date.now();
  const reg = tentativas.get(ip);
  if (reg && agora - reg.desde > JANELA_MS) tentativas.delete(ip);
  const atual = tentativas.get(ip);
  return atual && atual.n >= MAX_TENTATIVAS ? Math.ceil((JANELA_MS - (agora - atual.desde)) / 60000) : 0;
}
async function falhou(ip: string) {
  if (redisAtivo()) return contarFalha(ip);
  const atual = tentativas.get(ip);
  tentativas.set(ip, { n: (atual?.n ?? 0) + 1, desde: atual?.desde ?? Date.now() });
  if (tentativas.size > 5000) tentativas.clear();
}
async function acertou(ip: string) {
  if (redisAtivo()) return limparFalhas(ip);
  tentativas.delete(ip);
}
const espera = () => new Promise((r) => setTimeout(r, 1000));

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = ipDe(h);
  const log = (evento: string, ok: boolean) => (redisAtivo() ? registrarEntrada(evento, ok, h) : Promise.resolve());
  const etapaCodigo = formData.get("etapa") === "codigo";

  try {
    const min = await bloqueadoPorMin(ip);
    if (min > 0) {
      await log("Bloqueado: muitas tentativas erradas", false);
      return { error: `Muitas tentativas erradas. Tente de novo em ${min} min.`, etapa: etapaCodigo ? "codigo" : "senha" };
    }

    if (etapaCodigo) {
      if (!(await preSessaoValida())) {
        return { error: "O tempo para digitar o código acabou. Entre com a senha de novo.", etapa: "senha" };
      }
      const codigo = String(formData.get("codigo") ?? "").slice(0, 20);
      const como = await conferirSegundoFator(codigo);
      if (!como) {
        await falhou(ip);
        await log("Código do celular errado", false);
        await espera();
        return { error: "Código errado ou vencido. Confira o app e digite o código que está aparecendo agora.", etapa: "codigo" };
      }
      await acertou(ip);
      await apagarPreSessao();
      await createSession({ mfa: true });
      await log(como === "reserva" ? "Entrou com um código reserva" : "Entrou (senha + código)", true);
    } else {
      const password = String(formData.get("password") ?? "");
      if (!password || password.length > 200 || !verifyPassword(password)) {
        await falhou(ip);
        await log("Senha errada", false);
        await espera();
        return { error: "Senha incorreta.", etapa: "senha" };
      }
      if (redisAtivo() && (await doisFatoresAtivo())) {
        await criarPreSessao();
        return { etapa: "codigo" };
      }
      await acertou(ip);
      await createSession();
      await log("Entrou (só senha)", true);
    }
  } catch (err) {
    unstable_rethrow(err);
    console.error("login", err);
    return { error: "Não deu para entrar agora. Tente de novo em instantes.", etapa: etapaCodigo ? "codigo" : "senha" };
  }
  redirect("/admin");
}

/** Signs out every device (the current one included). */
export async function logoutTodosAction() {
  await requireAdmin();
  await revogarTodasAsSessoes();
  if (redisAtivo()) await registrarEntrada("Saiu de todos os aparelhos", true, await headers());
  await destroySession();
  redirect("/admin/login");
}

// Only real images get committed to the repo: checked by declared type,
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
  revalidatePath("/", "layout");
}

/** A problem the admin user can fix — its message is shown as is. */
class Aviso extends Error {}

/** What every admin form gets back: shown as a toast, never a crash page. */
export type Resultado =
  | { ok: true; msg: string; ir?: string; em: number }
  | { ok: false; erro: string; em: number }
  | undefined;

async function executar(fn: () => Promise<{ msg: string; ir?: string } | string>): Promise<Resultado> {
  await requireAdmin();
  try {
    const r = await fn();
    revalidateSite();
    return typeof r === "string" ? { ok: true, msg: r, em: Date.now() } : { ok: true, ...r, em: Date.now() };
  } catch (err) {
    unstable_rethrow(err);
    console.error("admin action failed", err);
    const legivel = err instanceof Aviso || (err instanceof Error && /GitHub|conteúdo mudou|GITHUB_TOKEN/.test(err.message));
    const erro = legivel ? (err as Error).message : "Não deu para salvar. Confira a internet e tente de novo.";
    return { ok: false, erro, em: Date.now() };
  }
}

const PRONTO = "Salvo! O site atualiza em 1 a 2 minutos.";
const SUMIU = "Isso não existe mais (alguém pode ter excluído). Recarregue o painel.";
const txt = (fd: FormData, k: string, atual: string) => (fd.has(k) ? String(fd.get(k) ?? "") : atual);

export async function updateHeroAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    content.hero.titulo = txt(formData, "titulo", content.hero.titulo);
    content.hero.subtitulo = txt(formData, "subtitulo", content.hero.subtitulo);
    const tags: string[] = [];
    for (let i = 0; formData.has(`tag${i}`); i++) {
      const value = String(formData.get(`tag${i}`) ?? "").trim();
      if (value) tags.push(value);
    }
    content.hero.tags = tags;
    await saveContent(content, "edita as boas-vindas");
    return PRONTO;
  });
}

export async function updateSiteAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    content.site.nome = txt(formData, "nome", content.site.nome);
    content.site.descricao = txt(formData, "descricao", content.site.descricao);
    content.site.whatsappNumero = txt(formData, "whatsappNumero", content.site.whatsappNumero).replace(/\D/g, "");
    content.site.instagramHandle = txt(formData, "instagramHandle", content.site.instagramHandle)
      .replace(/^@/, "")
      .trim();
    if (content.site.whatsappNumero.length < 12) throw new Aviso("O WhatsApp precisa ter o 55 + DDD + número (ex.: 5527999999999).");
    await saveContent(content, "edita as configurações do site");
    return PRONTO;
  });
}

export async function addCategoriaAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    const titulo = String(formData.get("titulo") ?? "").trim() || "Nova categoria";
    let slug = slugify(titulo);
    let n = 2;
    while (content.categorias.some((c) => c.slug === slug)) slug = `${slugify(titulo)}-${n++}`;
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
    await saveContent(content, `cria a categoria "${titulo}"`);
    return { msg: `Categoria "${titulo}" criada.`, ir: `/admin/catalogo?cat=${nova.id}` };
  });
}

export async function updateCategoriaAction(categoriaId: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    if (!cat) throw new Aviso(SUMIU);
    cat.titulo = txt(formData, "titulo", cat.titulo).trim() || cat.titulo;
    cat.resumo = txt(formData, "resumo", cat.resumo);
    cat.intro = txt(formData, "intro", cat.intro);
    cat.corA = txt(formData, "corA", cat.corA);
    cat.corB = txt(formData, "corB", cat.corB);
    await saveContent(content, `edita a categoria "${cat.titulo}"`);
    return PRONTO;
  });
}

export async function deleteCategoriaAction(categoriaId: string) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    content.categorias = content.categorias.filter((c) => c.id !== categoriaId);
    await saveContent(content, `exclui a categoria "${cat?.titulo ?? ""}"`);
    return { msg: "Categoria excluída.", ir: "/admin/catalogo" };
  });
}

export async function addModeloAction(categoriaId: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    if (!cat) throw new Aviso(SUMIU);
    const novo: Modelo = {
      id: crypto.randomUUID(),
      nome: String(formData.get("nome") ?? "").trim() || "Novo modelo",
      descricao: "",
      corA: "#15564C",
      corB: "#BD502E",
    };
    cat.modelos.push(novo);
    await saveContent(content, `cria o modelo "${novo.nome}"`);
    return {
      msg: `Modelo "${novo.nome}" criado. Agora coloque a foto e a descrição.`,
      ir: `/admin/catalogo/${cat.id}/${novo.id}`,
    };
  });
}

const MAX_FOTOS_EXTRAS = 8;

export async function updateModeloAction(categoriaId: string, modeloId: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    const modelo = cat?.modelos.find((m) => m.id === modeloId);
    if (!cat || !modelo) throw new Aviso(SUMIU);
    // Photos are staged and go into the same commit as the content.
    const fotos: ArquivoNovo[] = [];
    const guardar = async (f: File) => {
      const p = await prepararFoto(f);
      fotos.push(p.arquivo);
      return p.url;
    };

    modelo.nome = txt(formData, "nome", modelo.nome).trim() || modelo.nome;
    modelo.descricao = txt(formData, "descricao", modelo.descricao);
    modelo.corA = txt(formData, "corA", modelo.corA);
    modelo.corB = txt(formData, "corB", modelo.corB);

    const foto = await imagemValida(formData.get("foto"));
    if (foto) modelo.imagemUrl = await guardar(foto);
    else if (formData.get("removerFoto") === "on") modelo.imagemUrl = undefined;

    const variantes: (string | undefined)[] = [...(modelo.variantes ?? [])];
    for (const [i, n] of [2, 3, 4, 5, 6].entries()) {
      const fv = await imagemValida(formData.get(`fotoVariante${n}`));
      if (fv) variantes[i] = await guardar(fv);
      else if (formData.get(`removerVariante${n}`) === "on") variantes[i] = undefined;
    }
    const variantesOk = variantes.filter((v): v is string => Boolean(v));
    modelo.variantes = variantesOk.length > 0 ? variantesOk : undefined;

    const remover = new Set(formData.getAll("removerExtra").map(String));
    const extras = (modelo.fotosExtras ?? []).filter((url) => !remover.has(url));
    for (const entrada of formData.getAll("fotosExtrasNovas")) {
      const nova = extras.length < MAX_FOTOS_EXTRAS ? await imagemValida(entrada) : null;
      if (nova) extras.push(await guardar(nova));
    }
    modelo.fotosExtras = extras.length > 0 ? extras : undefined;

    await saveContent(content, `edita o modelo "${modelo.nome}"`, fotos);
    return PRONTO;
  });
}

export async function moverModeloAction(categoriaId: string, modeloId: string, direcao: number) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    if (!cat) throw new Aviso(SUMIU);
    const i = cat.modelos.findIndex((m) => m.id === modeloId);
    const j = i + (direcao < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= cat.modelos.length) return "Já está na ponta.";
    [cat.modelos[i], cat.modelos[j]] = [cat.modelos[j], cat.modelos[i]];
    await saveContent(content, `muda a ordem de "${cat.modelos[j].nome}"`);
    return "Ordem salva. O site atualiza em 1 a 2 minutos.";
  });
}

export async function deleteModeloAction(categoriaId: string, modeloId: string) {
  return executar(async () => {
    const content = await getContentForWrite();
    const cat = content.categorias.find((c) => c.id === categoriaId);
    if (!cat) throw new Aviso(SUMIU);
    const m = cat.modelos.find((x) => x.id === modeloId);
    cat.modelos = cat.modelos.filter((x) => x.id !== modeloId);
    await saveContent(content, `exclui o modelo "${m?.nome ?? ""}"`);
    return { msg: "Modelo excluído.", ir: `/admin/catalogo?cat=${cat.id}` };
  });
}

export async function addDepoimentoAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
    const texto = String(formData.get("texto") ?? "").trim().slice(0, 600);
    if (!nome || !texto) throw new Aviso("Preencha o nome do cliente e o que ele disse.");
    const foto = await imagemValida(formData.get("foto"));
    const preparada = foto ? await prepararFoto(foto) : undefined;
    const content = await getContentForWrite();
    const novo: Depoimento = {
      id: `dep-${crypto.randomUUID().slice(0, 8)}`,
      nome,
      cidade: String(formData.get("cidade") ?? "").trim().slice(0, 80) || undefined,
      texto,
      fotoUrl: preparada?.url,
    };
    content.depoimentos = [...content.depoimentos, novo];
    await saveContent(content, `adiciona o depoimento de ${nome}`, preparada ? [preparada.arquivo] : []);
    return "Depoimento adicionado! Aparece na página inicial em 1 a 2 minutos.";
  });
}

export async function deleteDepoimentoAction(id: string) {
  return executar(async () => {
    const content = await getContentForWrite();
    const d = content.depoimentos.find((x) => x.id === id);
    content.depoimentos = content.depoimentos.filter((x) => x.id !== id);
    await saveContent(content, `exclui o depoimento de ${d?.nome ?? ""}`);
    return "Depoimento excluído.";
  });
}

// --- Segurança: phone code (2FA) setup --------------------------------------

/** Step 1 of turning the phone code on: a new secret + its QR code. */
export async function iniciarDoisFatoresAction() {
  await requireAdmin();
  const { segredo, otpauth } = await iniciarDoisFatores();
  const QRCode = (await import("qrcode")).default;
  const qrSvg = await QRCode.toString(otpauth, { type: "svg", margin: 1, color: { dark: "#241f1a", light: "#fffefb" } });
  return { segredo, otpauth, qrSvg };
}

/** Step 2: the first code from the app proves the scan worked. */
export async function confirmarDoisFatoresAction(codigo: string): Promise<{ reservas?: string[]; erro?: string }> {
  await requireAdmin();
  const reservas = await confirmarDoisFatores(String(codigo).slice(0, 12));
  if (!reservas) return { erro: "Código não confere. Confira se escaneou o QR code e digite o código que está aparecendo agora no app." };
  // Older password-only sessions stop working now; keep this device signed in.
  await createSession({ mfa: true });
  await registrarEntrada("Ativou o código no celular", true, await headers());
  revalidatePath("/admin/seguranca");
  return { reservas };
}

export async function desativarDoisFatoresAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const codigo = String(formData.get("codigo") ?? "").slice(0, 20);
    if (!(await conferirSegundoFator(codigo))) throw new Aviso("Código errado. Para desligar, digite o código que está aparecendo agora no app.");
    await desativarDoisFatores();
    await registrarEntrada("Desligou o código no celular", true, await headers());
    revalidatePath("/admin/seguranca");
    return "Código no celular desligado. O painel volta a pedir só a senha.";
  });
}
