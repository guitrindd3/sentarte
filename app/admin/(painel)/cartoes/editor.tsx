"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CORES,
  FONTES,
  ICONES_CUIDADO,
  LIMITES,
  LOGOS,
  NOMES_FONTES,
  NOMES_FORMAS,
  NOMES_ICONES,
  NOMES_PARTES,
  porFolha,
  TAMANHOS,
  type Cartao,
  type FormaCartao,
  type IconeCuidado,
  type LogoCor,
  type Parte,
} from "@/lib/cartoes-modelo";
import { avisar, btnPrimary, btnSecondary, Card, inputClass } from "../../_ui";
import { excluirCartaoAction, salvarCartaoAction } from "../../actions";
import { CartaoVisual, IconeCuidadoSvg, type Edicao } from "./cartao-visual";
import { AbaFolha, cartoesDaFolha, PaginaA4, useFolha } from "./folha";
import { FAMILIA } from "./fontes";

const MM = 96 / 25.4; // CSS px per mm

/** The card at real size, scaled down to fit the box. */
function Escalado({
  c,
  max,
  maxAltura,
  corte = true,
  selecionado = null,
  onMover,
}: {
  c: Cartao;
  max?: number;
  maxAltura: number;
  corte?: boolean;
  selecionado?: Parte | null;
  /** given: the preview lets pieces be dragged (offset in mm; null = just selected) */
  onMover?: (parte: Parte, pos: { x: number; y: number } | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(max ?? 320);
  useLayoutEffect(() => {
    if (max || !ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    setLargura(el.clientWidth);
    return () => ro.disconnect();
  }, [max]);
  const w = c.largura * MM;
  const h = c.altura * MM;
  const s = Math.min((max ?? largura) / w, maxAltura / h, max ? 1 : 2.2);
  const edicao: Edicao | undefined = onMover
    ? {
        selecionado,
        onPegar: (parte, e) => {
          e.preventDefault();
          e.stopPropagation();
          onMover(parte, null);
          const inicio = { px: e.clientX, py: e.clientY, x: c.pos[parte]?.x ?? 0, y: c.pos[parte]?.y ?? 0 };
          const mover = (ev: PointerEvent) => {
            const x = Math.round((inicio.x + (ev.clientX - inicio.px) / (s * MM)) * 2) / 2;
            const y = Math.round((inicio.y + (ev.clientY - inicio.py) / (s * MM)) * 2) / 2;
            onMover(parte, { x, y });
          };
          const soltar = () => {
            window.removeEventListener("pointermove", mover);
            window.removeEventListener("pointerup", soltar);
            window.removeEventListener("pointercancel", soltar);
          };
          window.addEventListener("pointermove", mover);
          window.addEventListener("pointerup", soltar);
          window.addEventListener("pointercancel", soltar);
        },
      }
    : undefined;
  return (
    <div ref={ref} className={max ? "" : "w-full"}>
      <div className="mx-auto" style={{ width: w * s, height: h * s }}>
        <div style={{ transform: `scale(${s})`, transformOrigin: "top left", width: w, height: h }}>
          <CartaoVisual c={c} corte={corte} edicao={edicao} />
        </div>
      </div>
    </div>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-3 font-serif text-xl font-medium tracking-tight text-ink">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-espresso font-sans text-sm font-semibold text-paper">{n}</span>
        {titulo}
      </h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Rotulo({ texto, dica, children }: { texto: string; dica?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{texto}</span>
      {dica ? <span className="mt-0.5 block text-xs text-ink-soft">{dica}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Pilulas<T extends string>({ valor, opcoes, onChange }: { valor: T; opcoes: [T, ReactNode][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map(([v, rotulo]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={valor === v}
          className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
            valor === v ? "border-espresso bg-espresso text-paper" : "border-line bg-paper text-ink hover:border-wood"
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

function Deslizar({
  texto,
  valor,
  faixa,
  passo = 0.5,
  unidade,
  onChange,
}: {
  texto: string;
  valor: number;
  faixa: readonly [number, number];
  passo?: number;
  unidade: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-semibold text-ink">
        {texto}
        <span className="font-normal tabular-nums text-ink-soft">
          {String(valor).replace(".", ",")} {unidade}
        </span>
      </span>
      <input
        type="range"
        min={faixa[0]}
        max={faixa[1]}
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-wood"
      />
    </label>
  );
}

function Marcar({ texto, dica, valor, onChange }: { texto: string; dica?: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-wood" />
      <span>
        <span className="block text-sm font-semibold text-ink">{texto}</span>
        {dica ? <span className="block text-xs text-ink-soft">{dica}</span> : null}
      </span>
    </label>
  );
}

const SETAS: [string, number, number][] = [
  ["", 0, 0],
  ["↑", 0, -1],
  ["", 0, 0],
  ["←", -1, 0],
  ["", 0, 0],
  ["→", 1, 0],
  ["", 0, 0],
  ["↓", 0, 1],
  ["", 0, 0],
];

const cm = (mm: number) => String(mm / 10).replace(".", ",");
const deCm = (v: string) => Math.round(Number(v.replace(",", ".")) * 10);
const novoId = () => `meu-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function EditorCartoes({ prontos, salvosIniciais }: { prontos: Cartao[]; salvosIniciais: Cartao[] }) {
  const [salvos, setSalvos] = useState(salvosIniciais);
  const [c, setC] = useState<Cartao>(prontos[0]);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [linhaCorte, setLinhaCorte] = useState(true);
  const [aba, setAba] = useState<"editar" | "folha">("editar");
  /** piece picked in the preview (dashed outline, arrows move it) */
  const [selecionado, setSelecionado] = useState<Parte | null>(null);
  const [itensFolha, gravarFolha] = useFolha();
  const folhaMista = cartoesDaFolha(itensFolha);
  const naFolha = itensFolha.reduce((n, i) => n + i.qtd, 0);
  /** first tap on × asks, second one deletes */
  const [apagar, setApagar] = useState<string | null>(null);
  const [pendente, comecar] = useTransition();
  // the print sheet goes straight into <body> (portal), only in the browser
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const mudar = (p: Partial<Cartao>) => setC((a) => ({ ...a, ...p }));
  const ehMeu = salvos.some((s) => s.id === c.id);
  const folha = porFolha(c);
  const qtd = Math.max(1, Math.min(200, quantidade ?? (folha.total || 1)));
  const paginas = folha.total ? Math.ceil(qtd / folha.total) : 0;

  function mover(parte: Parte, pos: { x: number; y: number } | null) {
    setSelecionado(parte);
    if (!pos) return;
    setC((a) => {
      const p = { ...a.pos };
      if (pos.x === 0 && pos.y === 0) delete p[parte];
      else p[parte] = pos;
      return { ...a, pos: p };
    });
  }
  const empurrar = (dx: number, dy: number) => {
    if (!selecionado) return;
    const p = c.pos[selecionado] ?? { x: 0, y: 0 };
    mover(selecionado, { x: p.x + dx, y: p.y + dy });
  };

  function porNaFolha() {
    gravarFolha([...itensFolha, { chave: "editor-" + Date.now().toString(36), c, qtd }]);
    avisar("ok", qtd === 1 ? "1 cartão foi para a aba Folha." : qtd + " cartões foram para a aba Folha.");
  }

  function escolher(m: Cartao) {
    setSelecionado(null);
    setC(m);
    setQuantidade(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mudarForma(forma: FormaCartao) {
    if (forma === "redondo") {
      const lado = Math.max(c.largura, c.altura) > 100 ? 80 : Math.min(c.largura, c.altura);
      mudar({ forma, largura: lado, altura: lado, logo: "topo", alinhar: "centro" });
    } else mudar({ forma });
  }

  function salvar(comoNovo: boolean) {
    const nome = c.nome.trim() || "Meu cartão";
    const cartao: Cartao = { ...c, nome, id: comoNovo || !ehMeu ? novoId() : c.id };
    comecar(async () => {
      const r = await salvarCartaoAction(cartao);
      if (r?.ok) {
        setC(cartao);
        setSalvos((l) => (l.some((x) => x.id === cartao.id) ? l.map((x) => (x.id === cartao.id ? cartao : x)) : [cartao, ...l]));
        avisar("ok", r.msg);
      } else avisar("erro", r?.erro ?? "Não deu para salvar.");
    });
  }

  function excluir(m: Cartao) {
    comecar(async () => {
      const r = await excluirCartaoAction(m.id);
      if (r?.ok) {
        setSalvos((l) => l.filter((x) => x.id !== m.id));
        avisar("ok", r.msg);
      } else avisar("erro", r?.erro ?? "Não deu para excluir.");
    });
  }

  const tamanhoAtual = TAMANHOS.findIndex((t) => t.largura === c.largura && t.altura === c.altura);
  const miniatura = (m: Cartao, meu: boolean) => (
    <li key={m.id} className="relative">
      <button
        type="button"
        onClick={() => escolher(m)}
        className={`flex h-full w-full flex-col items-center gap-2 rounded-2xl border bg-canvas p-3 text-center transition hover:border-wood ${c.id === m.id ? "border-wood ring-4 ring-rattan/25" : "border-line/70"}`}
      >
        <div className="grid h-[118px] w-full place-items-center">
          <Escalado c={m} max={140} maxAltura={112} corte={false} />
        </div>
        <span className="text-sm font-semibold leading-tight text-ink">{m.nome}</span>
        <span className="text-xs text-ink-soft">
          {cm(m.largura)} × {cm(m.altura)} cm
        </span>
      </button>
      {meu ? (
        <button
          type="button"
          onClick={() => (apagar === m.id ? excluir(m) : setApagar(m.id))}
          onBlur={() => setApagar((a) => (a === m.id ? null : a))}
          disabled={pendente}
          aria-label={apagar === m.id ? `Confirmar: excluir ${m.nome}` : `Excluir ${m.nome}`}
          className={`absolute right-2 top-2 grid h-7 place-items-center rounded-full shadow-sm ring-1 transition ${
            apagar === m.id ? "bg-clay px-3 text-xs font-semibold text-paper ring-clay" : "w-7 bg-paper/90 text-ink-soft ring-line hover:text-clay"
          }`}
        >
          {apagar === m.id ? (
            "Excluir?"
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          )}
        </button>
      ) : null}
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Cartões</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Cartão de visita, etiqueta De/Para, cartão de aniversário, agradecimento e cuidados com a cadeira, todos com a logo do Ateliê. Escolha um modelo, mude
          o que quiser e imprima numa folha A4 (ou salve em PDF).
        </p>
      </div>

      <div className="flex gap-2 rounded-full bg-canvas-deep p-1.5 sm:inline-flex" role="tablist">
        {(
          [
            ["editar", "Criar e editar"],
            ["folha", "Folha para imprimir" + (naFolha ? " (" + naFolha + ")" : "")],
          ] as const
        ).map(([v, rotulo]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={aba === v}
            onClick={() => setAba(v)}
            className={
              "flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition sm:flex-none " +
              (aba === v ? "bg-espresso text-paper shadow-sm" : "text-ink hover:bg-paper")
            }
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "folha" ? (
        <AbaFolha modelos={[...salvos, ...prontos]} atual={c} itens={itensFolha} gravar={gravarFolha} linhaCorte={linhaCorte} setLinhaCorte={setLinhaCorte} />
      ) : (
        <>
          <Card titulo="Escolha um modelo" descricao="Os prontos são um ponto de partida: tudo pode ser mudado. Os que você salvar aparecem em “Meus modelos”.">
            {salvos.length ? (
              <>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Meus modelos</h3>
                <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{salvos.map((m) => miniatura(m, true))}</ul>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Prontos</h3>
              </>
            ) : null}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{prontos.map((m) => miniatura(m, false))}</ul>
          </Card>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
            <div className="space-y-6">
              <Passo n={1} titulo="Formato e tamanho">
                <Pilulas<FormaCartao>
                  valor={c.forma}
                  onChange={mudarForma}
                  opcoes={(Object.keys(NOMES_FORMAS) as FormaCartao[]).map((f) => [f, NOMES_FORMAS[f]])}
                />
                <Rotulo texto="Tamanho">
                  <select
                    className={inputClass}
                    value={tamanhoAtual}
                    onChange={(e) => {
                      const t = TAMANHOS[Number(e.target.value)];
                      if (!t) return;
                      if (c.forma === "redondo") mudar({ largura: Math.min(t.largura, t.altura), altura: Math.min(t.largura, t.altura) });
                      else mudar({ largura: t.largura, altura: t.altura });
                    }}
                  >
                    <option value={-1}>Do meu jeito (abaixo)</option>
                    {TAMANHOS.map((t, i) => (
                      <option key={t.nome} value={i}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </Rotulo>
                <div className="flex flex-wrap items-end gap-3">
                  <Rotulo texto={c.forma === "redondo" ? "Diâmetro (cm)" : "Largura (cm)"}>
                    <input
                      key={`l${c.id}${c.largura}`}
                      inputMode="decimal"
                      defaultValue={cm(c.largura)}
                      onBlur={(e) => {
                        const v = Math.min(LIMITES.largura[1], Math.max(LIMITES.largura[0], deCm(e.target.value) || c.largura));
                        mudar(c.forma === "redondo" ? { largura: v, altura: v } : { largura: v });
                      }}
                      className={`${inputClass} w-28`}
                    />
                  </Rotulo>
                  {c.forma !== "redondo" ? (
                    <>
                      <Rotulo texto="Altura (cm)">
                        <input
                          key={`a${c.id}${c.altura}`}
                          inputMode="decimal"
                          defaultValue={cm(c.altura)}
                          onBlur={(e) => mudar({ altura: Math.min(LIMITES.altura[1], Math.max(LIMITES.altura[0], deCm(e.target.value) || c.altura)) })}
                          className={`${inputClass} w-28`}
                        />
                      </Rotulo>
                      <button type="button" className={btnSecondary} onClick={() => mudar({ largura: c.altura, altura: c.largura })}>
                        Deitar / pôr em pé
                      </button>
                    </>
                  ) : null}
                </div>
                <p className="text-xs text-ink-soft">De 3 a 20 cm. Digite e toque fora do campo para aplicar.</p>
                <Marcar
                  texto="Furo para amarrar"
                  dica="Um furinho no alto, para passar um cordão ou fita."
                  valor={c.furo || c.forma === "etiqueta"}
                  onChange={(v) => mudar({ furo: v })}
                />
              </Passo>

              <Passo n={2} titulo="Textos">
                <Rotulo texto="Título">
                  <textarea rows={1} value={c.titulo} maxLength={80} onChange={(e) => mudar({ titulo: e.target.value })} className={inputClass} />
                </Rotulo>
                <Rotulo texto="Linha pequena embaixo do título" dica="Ex.: Cadeiras trançadas à mão. Em branco não aparece.">
                  <input value={c.subtitulo} maxLength={80} onChange={(e) => mudar({ subtitulo: e.target.value })} className={inputClass} />
                </Rotulo>
                <Rotulo texto="Texto" dica="Pode pular linha (Enter). Em branco não aparece.">
                  <textarea rows={3} value={c.texto} maxLength={400} onChange={(e) => mudar({ texto: e.target.value })} className={inputClass} />
                </Rotulo>
                <Rotulo texto="Rodapé" dica="Começando com @ aparece o ícone do Instagram. Ex.: @atelie_sentarte ou Feito com amor.">
                  <input value={c.rodape} maxLength={60} onChange={(e) => mudar({ rodape: e.target.value })} className={inputClass} />
                </Rotulo>
                <Marcar
                  texto="Mostrar “De:” e “Para:”"
                  dica="Deixe os nomes em branco para escrever à mão na linha pontilhada."
                  valor={c.dePara}
                  onChange={(v) => mudar({ dePara: v })}
                />
                {c.dePara ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Rotulo texto="De">
                      <input
                        value={c.de}
                        maxLength={40}
                        onChange={(e) => mudar({ de: e.target.value })}
                        className={inputClass}
                        placeholder="Em branco: linha para escrever"
                      />
                    </Rotulo>
                    <Rotulo texto="Para">
                      <input
                        value={c.para}
                        maxLength={40}
                        onChange={(e) => mudar({ para: e.target.value })}
                        className={inputClass}
                        placeholder="Em branco: linha para escrever"
                      />
                    </Rotulo>
                  </div>
                ) : null}
                <div>
                  <span className="text-sm font-semibold text-ink">Cuidados com ícones</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">Como na etiqueta de cuidados: cada item tem um desenho e uma frase curta.</span>
                  <ul className="mt-2 space-y-2">
                    {c.cuidados.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-ink">
                          <IconeCuidadoSvg icone={item.icone} tam="22px" />
                        </span>
                        <select
                          value={item.icone}
                          onChange={(e) => mudar({ cuidados: c.cuidados.map((x, j) => (j === i ? { ...x, icone: e.target.value as IconeCuidado } : x)) })}
                          className={`${inputClass} w-36 shrink-0`}
                          aria-label="Desenho"
                        >
                          {ICONES_CUIDADO.map((ic) => (
                            <option key={ic} value={ic}>
                              {NOMES_ICONES[ic]}
                            </option>
                          ))}
                        </select>
                        <input
                          value={item.texto}
                          maxLength={40}
                          onChange={(e) => mudar({ cuidados: c.cuidados.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })}
                          className={inputClass}
                          aria-label="Frase"
                        />
                        <button
                          type="button"
                          onClick={() => mudar({ cuidados: c.cuidados.filter((_, j) => j !== i) })}
                          className="shrink-0 rounded-full px-2 py-1 text-sm text-ink-soft hover:text-clay"
                          aria-label="Tirar este item"
                        >
                          Tirar
                        </button>
                      </li>
                    ))}
                  </ul>
                  {c.cuidados.length < 8 ? (
                    <button
                      type="button"
                      className={`${btnSecondary} mt-2`}
                      onClick={() => mudar({ cuidados: [...c.cuidados, { icone: "pano", texto: "Limpe com pano úmido" }] })}
                    >
                      + Item de cuidado
                    </button>
                  ) : null}
                </div>
              </Passo>

              <Passo n={3} titulo="Letras">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Rotulo texto="Fonte do título">
                    <select
                      value={c.fonteTitulo}
                      onChange={(e) => mudar({ fonteTitulo: e.target.value as Cartao["fonteTitulo"] })}
                      className={inputClass}
                      style={{ fontFamily: FAMILIA[c.fonteTitulo] }}
                    >
                      {FONTES.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: FAMILIA[f] }}>
                          {NOMES_FONTES[f]}
                        </option>
                      ))}
                    </select>
                  </Rotulo>
                  <Rotulo texto="Fonte do texto">
                    <select
                      value={c.fonteTexto}
                      onChange={(e) => mudar({ fonteTexto: e.target.value as Cartao["fonteTexto"] })}
                      className={inputClass}
                      style={{ fontFamily: FAMILIA[c.fonteTexto] }}
                    >
                      {FONTES.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: FAMILIA[f] }}>
                          {NOMES_FONTES[f]}
                        </option>
                      ))}
                    </select>
                  </Rotulo>
                  <Deslizar texto="Tamanho do título" valor={c.tamTitulo} faixa={LIMITES.tamTitulo} unidade="pt" onChange={(v) => mudar({ tamTitulo: v })} />
                  <Deslizar texto="Tamanho do texto" valor={c.tamTexto} faixa={LIMITES.tamTexto} unidade="pt" onChange={(v) => mudar({ tamTexto: v })} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink">Alinhamento</span>
                  <div className="mt-1.5">
                    <Pilulas
                      valor={c.alinhar}
                      onChange={(v) => mudar({ alinhar: v })}
                      opcoes={[
                        ["centro", "Centralizado"],
                        ["esquerda", "À esquerda"],
                      ]}
                    />
                  </div>
                </div>
              </Passo>

              <Passo n={4} titulo="Cores e logo">
                <div className="flex flex-wrap gap-2">
                  {CORES.map((k) => (
                    <button
                      key={k.nome}
                      type="button"
                      onClick={() => mudar({ fundo: k.fundo, cor: k.cor, destaque: k.destaque })}
                      className="flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-ink hover:border-wood"
                    >
                      <span className="relative grid h-7 w-7 place-items-center rounded-full ring-1 ring-black/10" style={{ background: k.fundo }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: k.destaque }} />
                      </span>
                      {k.nome}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["fundo", "Fundo"],
                      ["cor", "Letras"],
                      ["destaque", "Detalhes"],
                    ] as const
                  ).map(([k, rotulo]) => (
                    <label key={k} className="block">
                      <span className="text-sm font-semibold text-ink">{rotulo}</span>
                      <input
                        type="color"
                        value={c[k]}
                        onChange={(e) => mudar({ [k]: e.target.value })}
                        className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-paper p-1"
                      />
                    </label>
                  ))}
                </div>
                <Marcar
                  texto="Imprimir a cor de fundo"
                  dica="No papel kraft deixe desmarcado: a impressora põe só a tinta preta e a cor fica a do papel (a prévia mostra como vai ficar)."
                  valor={c.imprimirFundo}
                  onChange={(v) => mudar({ imprimirFundo: v })}
                />
                <Marcar texto="Moldura fina por dentro" valor={c.moldura} onChange={(v) => mudar({ moldura: v })} />
                <div>
                  <span className="text-sm font-semibold text-ink">Logo do Ateliê</span>
                  <div className="mt-1.5">
                    <Pilulas
                      valor={c.logo}
                      onChange={(v) => mudar({ logo: v })}
                      opcoes={[
                        ["topo", "Em cima"],
                        ["lado", "Do lado"],
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink">Cor da logo</span>
                  <div className="mt-1.5">
                    <Pilulas<LogoCor>
                      valor={c.logoCor}
                      onChange={(v) => mudar({ logoCor: v })}
                      opcoes={(Object.keys(LOGOS) as LogoCor[]).map((k) => [k, LOGOS[k].nome])}
                    />
                  </div>
                </div>
                <Deslizar texto="Tamanho da logo" valor={c.logoTam} faixa={LIMITES.logoTam} passo={1} unidade="mm" onChange={(v) => mudar({ logoTam: v })} />
              </Passo>
            </div>

            <div className="space-y-4 lg:sticky lg:top-6">
              <Card>
                <div className="rounded-2xl bg-[repeating-conic-gradient(#f3efe8_0_25%,#fbf9f5_0_50%)] bg-[length:18px_18px] p-5">
                  <Escalado c={c} maxAltura={420} selecionado={selecionado} onMover={mover} />
                </div>
                <p className="mt-3 text-center text-xs text-ink-soft">
                  Tamanho real: {cm(c.largura)} × {cm(c.altura)} cm
                </p>
                <div className="mt-4 rounded-2xl border border-line/70 bg-canvas p-4">
                  {selecionado ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">Movendo: {NOMES_PARTES[selecionado]}</p>
                        <button type="button" onClick={() => setSelecionado(null)} className="text-xs font-medium text-ink-soft hover:text-ink">
                          Pronto
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="grid grid-cols-3 gap-1">
                          {SETAS.map(([seta, dx, dy], i) =>
                            seta ? (
                              <button
                                key={i}
                                type="button"
                                onClick={() => empurrar(dx, dy)}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-paper text-ink hover:border-wood"
                                aria-label={"Mover 1 mm " + seta}
                              >
                                {seta}
                              </button>
                            ) : (
                              <span key={i} />
                            ),
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-ink-soft">Cada toque move 1 mm.</p>
                          <button type="button" onClick={() => mover(selecionado, { x: 0, y: 0 })} className={btnSecondary} disabled={!c.pos[selecionado]}>
                            Voltar ao lugar
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-ink-soft">
                      <strong className="text-ink">Para mover:</strong> arraste a logo ou qualquer texto na prévia. Toque nele para ajustar com as setas.
                    </p>
                  )}
                  {Object.keys(c.pos).length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelecionado(null);
                        mudar({ pos: {} });
                      }}
                      className="mt-3 text-xs font-medium text-clay underline-offset-2 hover:underline"
                    >
                      Pôr tudo de volta no lugar automático
                    </button>
                  ) : null}
                </div>
              </Card>

              <Card>
                <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Imprimir</h2>
                {folha.total ? (
                  <>
                    <p className="mt-1 text-sm text-ink-soft">
                      Cabem <strong className="text-ink">{folha.total}</strong> por folha A4 ({folha.colunas} × {folha.linhas}).
                    </p>
                    <div className="mt-3 flex items-end gap-3">
                      <Rotulo texto="Quantos">
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={qtd}
                          onChange={(e) => setQuantidade(Number(e.target.value) || 1)}
                          className={`${inputClass} w-24`}
                        />
                      </Rotulo>
                      <p className="pb-3 text-sm text-ink-soft">
                        {paginas} {paginas === 1 ? "folha" : "folhas"}
                      </p>
                    </div>
                    <div className="mt-3">
                      <Marcar texto="Linha cinza de corte" dica="Ajuda a recortar quando o fundo é claro." valor={linhaCorte} onChange={setLinhaCorte} />
                    </div>
                    <button type="button" onClick={() => window.print()} className={`${btnPrimary} mt-4 w-full`}>
                      Imprimir ou salvar em PDF
                    </button>
                    <button type="button" onClick={porNaFolha} className={btnSecondary + " mt-2 w-full"}>
                      Pôr {qtd} na folha com outros cartões
                    </button>
                    <p className="mt-2 text-xs text-ink-soft">
                      Na janela de impressão, deixe a escala em 100% (“Tamanho real”) e as margens no padrão. Para PDF, escolha “Salvar como PDF”.
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-clay-dark">Esse tamanho não cabe numa folha A4. Diminua para no máximo 19 × 28 cm.</p>
                )}
              </Card>

              <Card>
                <h2 className="font-serif text-xl font-medium tracking-tight text-ink">Guardar este modelo</h2>
                <div className="mt-3">
                  <Rotulo texto="Nome do modelo">
                    <input value={c.nome} maxLength={60} onChange={(e) => mudar({ nome: e.target.value })} className={inputClass} />
                  </Rotulo>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={pendente} onClick={() => salvar(false)} className={btnPrimary}>
                    {pendente ? "Salvando…" : ehMeu ? "Salvar alterações" : "Salvar em Meus modelos"}
                  </button>
                  {ehMeu ? (
                    <button type="button" disabled={pendente} onClick={() => salvar(true)} className={btnSecondary}>
                      Salvar como novo
                    </button>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {montado
        ? createPortal(
            <div className="folha-cartoes">
              <style>{`
                @page { size: A4; margin: 8mm }
                @media screen { .folha-cartoes { display: none } }
                @media print {
                  body > *:not(.folha-cartoes) { display: none !important }
                  body { background: #fff !important; padding: 0 !important; margin: 0 !important }
                  .folha-cartoes .pagina { break-after: page; display: grid; justify-content: center; align-content: start; gap: 3mm }
                  .folha-cartoes .pagina:last-child { break-after: auto }
                  .folha-cartoes .pagina-mista { break-after: page }
                  .folha-cartoes .pagina-mista:last-child { break-after: auto }
                }
              `}</style>
              {aba === "folha"
                ? folhaMista.paginas.map((p, n) => (
                    <div key={n} className="pagina-mista">
                      <PaginaA4 cartoes={p} corte={linhaCorte} />
                    </div>
                  ))
                : Array.from({ length: paginas }, (_, p) => (
                    <div key={p} className="pagina" style={{ gridTemplateColumns: `repeat(${folha.colunas}, ${c.largura}mm)` }}>
                      {Array.from({ length: Math.min(folha.total, qtd - p * folha.total) }, (_, i) => (
                        <CartaoVisual key={i} c={c} semFundo={!c.imprimirFundo} corte={linhaCorte} />
                      ))}
                    </div>
                  ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
