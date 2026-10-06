"use server";

import { revalidatePath, updateTag } from "next/cache";
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
import { excluirInteressado, excluirPedido, gravarPedido, lerPedido, type EtapaPedido } from "@/lib/clientes";
import { desligarGmail, desligarNtfy, estadoAvisos, ligarNtfy, salvarGmail, testarAvisos } from "@/lib/avisos";
import {
  atualizarEnvios,
  colocarNoCarrinho,
  cotarEnvio,
  ErroEnvio,
  pagarEImprimir,
  remetenteCompleto,
  salvarRemetente,
  tirarDoCarrinho,
  type OpcaoEnvio,
  type Remetente,
} from "@/lib/melhor-envio";
import { cpfValido } from "@/lib/pedido";
import { avaliacoesPendentes, tirarAvaliacao } from "@/lib/avaliacoes";
import { normalizarCodigo } from "@/lib/cupom";
import { paginaEditavel, type Bloco, type ValorCampo } from "@/lib/textos-paginas";
import { excluirCupom, listarCupons, salvarCupom } from "@/lib/cupons-store";
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
  novosCodigosReserva,
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
    const google = txt(formData, "googleUrl", content.site.googleUrl).trim();
    if (google && !/^https:\/\/[^\s]+$/.test(google)) throw new Aviso("O link do Google precisa começar com https://");
    content.site.googleUrl = google;
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
      estrelas: estrelasDoForm(formData),
    };
    content.depoimentos = [...content.depoimentos, novo];
    await saveContent(content, `adiciona o depoimento de ${nome}`, preparada ? [preparada.arquivo] : []);
    return "Depoimento adicionado! Aparece na página inicial em 1 a 2 minutos.";
  });
}

function estrelasDoForm(fd: FormData) {
  const n = Math.round(Number(fd.get("estrelas")));
  return n >= 1 && n <= 5 ? n : undefined;
}

/** Approves a customer's review from the site (texts may be corrected first; a photo may be added). */
export async function aprovarAvaliacaoAction(id: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const pendente = (await avaliacoesPendentes()).find((a) => a.id === id);
    if (!pendente) throw new Aviso(SUMIU);
    const nome = String(formData.get("nome") ?? pendente.nome).trim().slice(0, 80) || pendente.nome;
    const texto = String(formData.get("texto") ?? pendente.texto).trim().slice(0, 600) || pendente.texto;
    const foto = await imagemValida(formData.get("foto"));
    const preparada = foto ? await prepararFoto(foto) : undefined;
    const content = await getContentForWrite();
    content.depoimentos = [
      ...content.depoimentos,
      {
        id: `dep-${crypto.randomUUID().slice(0, 8)}`,
        nome,
        cidade: String(formData.get("cidade") ?? pendente.cidade ?? "").trim().slice(0, 80) || undefined,
        texto,
        estrelas: estrelasDoForm(formData) ?? pendente.estrelas,
        fotoUrl: preparada?.url,
      },
    ];
    await saveContent(content, `aprova a avaliação de ${nome}`, preparada ? [preparada.arquivo] : []);
    await tirarAvaliacao(id);
    return "Avaliação aprovada! Aparece na página inicial em 1 a 2 minutos.";
  });
}

export async function recusarAvaliacaoAction(id: string) {
  return executar(async () => {
    await tirarAvaliacao(id);
    return "Avaliação recusada. Ela não vai aparecer no site.";
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

// --- Clientes ------------------------------------------------------------------

export async function excluirPedidoAction(ref: string) {
  return executar(async () => {
    await excluirPedido(ref);
    return "Pedido apagado da lista.";
  });
}

export async function excluirInteressadoAction(id: string) {
  return executar(async () => {
    await excluirInteressado(id);
    return "Contato tirado da lista de novidades.";
  });
}

// --- Cupons ------------------------------------------------------------------------

/** Creates or edits a coupon (`original` = the code being edited). */
export async function salvarCupomAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const original = String(formData.get("original") ?? "");
    const codigo = normalizarCodigo(String(formData.get("codigo") ?? ""));
    if (codigo.length < 3) throw new Aviso("O código precisa ter pelo menos 3 letras ou números (sem espaço).");
    const tipo = formData.get("tipo") === "valor" ? "valor" : "percentual";
    const valor = Number(String(formData.get("valor") ?? "").replace(",", "."));
    if (!(valor > 0)) throw new Aviso("Diga quanto é o desconto.");
    if (tipo === "percentual" && valor > 90) throw new Aviso("O desconto em % vai até 90%.");
    if (tipo === "valor" && valor > 5000) throw new Aviso("Esse desconto em reais está alto demais.");
    const minCadeiras = Math.min(50, Math.max(1, Math.floor(Number(formData.get("minCadeiras")) || 1)));
    const validoAte = String(formData.get("validoAte") ?? "").trim();
    if (validoAte && !/^\d{4}-\d{2}-\d{2}$/.test(validoAte)) throw new Aviso("Data de validade inválida.");
    const limite = Math.floor(Number(formData.get("limiteUsos")) || 0);

    const todos = await listarCupons();
    if (codigo !== original && todos.some((c) => c.codigo === codigo)) throw new Aviso(`Já existe um cupom ${codigo}.`);
    const antigo = todos.find((c) => c.codigo === original);
    await salvarCupom({
      codigo,
      tipo,
      valor: Math.round(valor * 100) / 100,
      minCadeiras,
      automatico: formData.get("automatico") === "on",
      ativo: antigo ? antigo.ativo : true,
      validoAte: validoAte || undefined,
      limiteUsos: limite > 0 ? limite : undefined,
      descricao: String(formData.get("descricao") ?? "").trim().slice(0, 120) || undefined,
      criadoEm: antigo?.criadoEm ?? Date.now(),
    });
    if (antigo && original !== codigo) await excluirCupom(original);
    revalidatePath("/admin/cupons");
    updateTag("cupons");
    revalidateSite();
    return antigo ? `Cupom ${codigo} salvo. Já está valendo no site.` : `Cupom ${codigo} criado. Já está valendo no site.`;
  });
}

export async function alternarCupomAction(codigo: string) {
  return executar(async () => {
    const c = (await listarCupons()).find((x) => x.codigo === codigo);
    if (!c) throw new Aviso(SUMIU);
    const { usos: _usos, ...resto } = c;
    void _usos;
    await salvarCupom({ ...resto, ativo: !c.ativo });
    revalidatePath("/admin/cupons");
    updateTag("cupons");
    revalidateSite();
    return c.ativo ? `Cupom ${codigo} desligado.` : `Cupom ${codigo} ligado.`;
  });
}

export async function excluirCupomAction(codigo: string) {
  return executar(async () => {
    await excluirCupom(codigo);
    revalidatePath("/admin/cupons");
    updateTag("cupons");
    revalidateSite();
    return `Cupom ${codigo} apagado.`;
  });
}

// --- Páginas (texts of each site page) ----------------------------------------------

export async function salvarPaginaAction(paginaId: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const pg = paginaEditavel(paginaId);
    if (!pg) throw new Aviso(SUMIU);
    const content = await getContentForWrite();
    const novo: Record<string, ValorCampo> = {};
    const fotos: ArquivoNovo[] = [];
    for (const c of pg.campos) {
      let v: ValorCampo;
      if (c.tipo === "fotos") {
        // Order tokens: "u:<url>" keeps a photo already in use, "n:<k>" is the k-th new file.
        const permitidas = new Set([...((content.paginas[pg.id]?.[c.id] as string[] | undefined) ?? []), ...(pg.padrao[c.id] as string[])]);
        let ordem: string[] = [];
        try {
          ordem = JSON.parse(String(formData.get(`${c.id}.ordem`) ?? "[]"));
        } catch {}
        const novos = formData.getAll(`${c.id}.novos`);
        const lista: string[] = [];
        for (const tok of ordem.slice(0, c.max)) {
          if (tok.startsWith("u:") && permitidas.has(tok.slice(2))) lista.push(tok.slice(2));
          else if (tok.startsWith("n:")) {
            const f = await imagemValida(novos[Number(tok.slice(2))] ?? null);
            if (f) {
              const p = await prepararFoto(f);
              fotos.push(p.arquivo);
              lista.push(p.url);
            }
          }
        }
        if (!lista.length) throw new Aviso(`"${c.rotulo}" precisa de pelo menos uma foto.`);
        v = lista;
      } else if (c.tipo === "imagem") {
        const atual = content.paginas[pg.id]?.[c.id];
        const nova = await imagemValida(formData.get(c.id));
        if (nova) {
          const p = await prepararFoto(nova);
          fotos.push(p.arquivo);
          v = p.url;
        } else if (formData.get(`${c.id}.remover`) === "on") {
          v = pg.padrao[c.id];
        } else {
          v = typeof atual === "string" ? atual : pg.padrao[c.id];
        }
      } else if (c.tipo === "blocos") {
        const titulos = formData.getAll(`${c.id}.titulo`).map((x) => String(x).trim());
        const textos = formData.getAll(`${c.id}.texto`).map((x) => String(x).trim());
        v = titulos.map((titulo, i) => ({ titulo, texto: textos[i] ?? "" })).filter((b) => b.titulo || b.texto);
        if (c.fixo && v.length !== (pg.padrao[c.id] as Bloco[]).length) throw new Aviso(`"${c.rotulo}" precisa ter todos os itens preenchidos.`);
      } else {
        v = String(formData.get(c.id) ?? "").replace(/\r\n/g, "\n").trim();
        if (!v && c.tipo === "linha" && c.id === "titulo") throw new Aviso("O título não pode ficar vazio.");
      }
      // Only what differs from the original wording is stored.
      if (JSON.stringify(v) !== JSON.stringify(pg.padrao[c.id])) novo[c.id] = v;
    }
    if (Object.keys(novo).length) content.paginas = { ...content.paginas, [pg.id]: novo };
    else {
      const resto = { ...content.paginas };
      delete resto[pg.id];
      content.paginas = resto;
    }
    await saveContent(content, `edita a página "${pg.nome}"`, fotos);
    return PRONTO;
  });
}

export async function restaurarPaginaAction(paginaId: string) {
  return executar(async () => {
    const pg = paginaEditavel(paginaId);
    if (!pg) throw new Aviso(SUMIU);
    const content = await getContentForWrite();
    const resto = { ...content.paginas };
    delete resto[pg.id];
    content.paginas = resto;
    await saveContent(content, `volta a página "${pg.nome}" ao texto original`);
    return { msg: "Pronto: a página voltou ao texto original.", ir: `/admin/paginas/${pg.id}` };
  });
}

export async function estrelasDepoimentoAction(id: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const content = await getContentForWrite();
    const d = content.depoimentos.find((x) => x.id === id);
    if (!d) throw new Aviso(SUMIU);
    d.estrelas = estrelasDoForm(formData);
    await saveContent(content, `muda as estrelas do depoimento de ${d.nome}`);
    return PRONTO;
  });
}

/** New recovery codes, after confirming with the app code (or a recovery code). */
export async function novosCodigosReservaAction(codigo: string): Promise<{ reservas?: string[]; erro?: string }> {
  await requireAdmin();
  if (!(await conferirSegundoFator(String(codigo).slice(0, 20)))) {
    return { erro: "Código errado. Digite o código que está aparecendo agora no app." };
  }
  const reservas = await novosCodigosReserva();
  await registrarEntrada("Gerou novos códigos reserva", true, await headers());
  revalidatePath("/admin/seguranca");
  return { reservas };
}

// --- orders: delivery steps + Melhor Envio labels (2026-10-06) ----------------------

async function pedidoOuAviso(ref: string) {
  const p = await lerPedido(ref);
  if (!p) throw new Aviso(SUMIU);
  return p;
}

function erroDeEnvio(err: unknown): never {
  if (err instanceof ErroEnvio) throw new Aviso(err.message);
  throw err;
}

export async function definirEtapaAction(ref: string, etapa: EtapaPedido) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    if (p.status !== "pago") throw new Aviso("Esse pedido ainda não foi pago.");
    p.etapa = etapa;
    p.etapaEm = { ...p.etapaEm, [etapa]: p.etapaEm?.[etapa] ?? Date.now() };
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return etapa === "producao" ? "Marcado como em produção." : etapa === "enviado" ? "Marcado como enviado." : "Marcado como entregue.";
  });
}

export async function salvarRastreioAction(ref: string, _p: Resultado, formData: FormData) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    p.rastreio = String(formData.get("rastreio") ?? "").trim().toUpperCase().slice(0, 80) || undefined;
    p.transportadora = String(formData.get("transportadora") ?? "").trim().slice(0, 40) || undefined;
    if (p.rastreio && p.status === "pago" && (p.etapa ?? "producao") === "producao") {
      p.etapa = "enviado";
      p.etapaEm = { ...p.etapaEm, enviado: Date.now() };
    }
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return p.rastreio ? "Rastreio salvo. O cliente já vê na página do pedido." : "Rastreio apagado.";
  });
}

export async function cotarEnvioAction(ref: string): Promise<{ ok: true; opcoes: OpcaoEnvio[] } | { ok: false; erro: string }> {
  await requireAdmin();
  try {
    const p = await lerPedido(ref);
    if (!p) return { ok: false, erro: SUMIU };
    const opcoes = await cotarEnvio(p);
    return opcoes.length ? { ok: true, opcoes } : { ok: false, erro: "Nenhuma transportadora atende esse endereço agora." };
  } catch (err) {
    console.error("cotarEnvio", err);
    return { ok: false, erro: err instanceof ErroEnvio ? err.message : "Não deu para falar com o Melhor Envio agora." };
  }
}

export async function criarEnvioAction(ref: string, servico: OpcaoEnvio) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    if (p.envios?.length) throw new Aviso("Esse pedido já tem envio no Melhor Envio.");
    p.envios = await colocarNoCarrinho(p, servico).catch(erroDeEnvio);
    p.transportadora = servico.nome;
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return "Envio colocado no carrinho do Melhor Envio.";
  });
}

export async function pagarEnvioAction(ref: string) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    if (!p.envios?.length) throw new Aviso("Coloque o envio no carrinho primeiro.");
    p.etiquetaUrl = await pagarEImprimir(p.envios).catch(erroDeEnvio);
    const envios = p.envios;
    p.envios = await atualizarEnvios(envios).catch(() => envios);
    const codigos = p.envios.map((e) => e.rastreio).filter(Boolean);
    if (codigos.length) p.rastreio = codigos.join(", ");
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return "Etiqueta paga e gerada! Imprima e cole no pacote.";
  });
}

export async function atualizarEnvioAction(ref: string) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    if (!p.envios?.length) throw new Aviso("Esse pedido não tem envio no Melhor Envio.");
    p.envios = await atualizarEnvios(p.envios).catch(erroDeEnvio);
    const codigos = p.envios.map((e) => e.rastreio).filter(Boolean);
    if (codigos.length) p.rastreio = codigos.join(", ");
    const st = p.envios.map((e) => e.status);
    if (p.status === "pago" && st.length && st.every((s) => s === "delivered") && p.etapa !== "entregue") {
      p.etapa = "entregue";
      p.etapaEm = { ...p.etapaEm, entregue: Date.now() };
    } else if (p.status === "pago" && st.some((s) => s === "posted" || s === "delivered") && (p.etapa ?? "producao") === "producao") {
      p.etapa = "enviado";
      p.etapaEm = { ...p.etapaEm, enviado: Date.now() };
    }
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return codigos.length ? "Envio atualizado." : "Atualizado. O código de rastreio ainda não saiu.";
  });
}

export async function tirarEnvioAction(ref: string) {
  return executar(async () => {
    const p = await pedidoOuAviso(ref);
    if (!p.envios?.length) throw new Aviso("Esse pedido não tem envio no carrinho.");
    if (p.etiquetaUrl) throw new Aviso("A etiqueta já foi paga. Para cancelar, use o site do Melhor Envio.");
    await tirarDoCarrinho(p.envios).catch(erroDeEnvio);
    p.envios = undefined;
    p.transportadora = undefined;
    await gravarPedido(p);
    revalidatePath(`/admin/clientes/${ref}`);
    return "Envio tirado do carrinho do Melhor Envio.";
  });
}

// --- sale alerts + shipping sender (admin "Avisos e envio") -------------------------

export async function ligarNtfyAction() {
  return executar(async () => {
    await ligarNtfy();
    revalidatePath("/admin/avisos");
    return "Aviso no celular ligado. Agora siga os passos para receber no seu celular.";
  });
}

export async function desligarNtfyAction() {
  return executar(async () => {
    await desligarNtfy();
    revalidatePath("/admin/avisos");
    return "Aviso no celular desligado.";
  });
}

export async function salvarGmailAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const senha = String(formData.get("senha") ?? "").replace(/\s+/g, "");
    if (!/^[^\s@]+@gmail\.com$/.test(email)) throw new Aviso("Use um e-mail do Gmail (termina com @gmail.com).");
    if (!/^[a-z]{16}$/i.test(senha)) throw new Aviso("A senha de app do Google tem 16 letras. Copie de novo do Google.");
    await salvarGmail(email, senha);
    revalidatePath("/admin/avisos");
    return "E-mail salvo. Clique em “Mandar aviso de teste” para conferir.";
  });
}

export async function desligarGmailAction() {
  return executar(async () => {
    await desligarGmail();
    revalidatePath("/admin/avisos");
    return "Aviso por e-mail desligado.";
  });
}

export async function testarAvisosAction() {
  return executar(async () => {
    const e = await estadoAvisos();
    if (!e.ntfy && !e.email) throw new Aviso("Ligue o aviso no celular ou por e-mail primeiro.");
    const erros = await testarAvisos();
    if (erros.length) throw new Aviso(`Não deu para mandar pelo ${erros.join(" nem pelo ")}.`);
    return "Aviso de teste enviado! Confira o celular / e-mail.";
  });
}

export async function salvarRemetenteAction(_p: Resultado, formData: FormData) {
  return executar(async () => {
    const t = (k: string, max = 80) => String(formData.get(k) ?? "").trim().slice(0, max);
    const r: Remetente = {
      nome: t("nome"),
      telefone: t("telefone", 20),
      email: t("email", 120),
      cpf: t("cpf", 20).replace(/\D/g, ""),
      cep: t("cep", 10).replace(/\D/g, ""),
      endereco: t("endereco", 120),
      numero: t("numero", 15),
      complemento: t("complemento", 60),
      bairro: t("bairro", 60),
      cidade: t("cidade", 60),
      uf: t("uf", 2).toUpperCase(),
    };
    if (!cpfValido(r.cpf)) throw new Aviso("Confira o CPF do remetente.");
    if (!remetenteCompleto(r)) throw new Aviso("Preencha todos os campos (só o complemento é opcional).");
    await salvarRemetente(r);
    revalidatePath("/admin/avisos");
    return "Dados do remetente salvos.";
  });
}
