"use client";

import { useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { idDaVisita } from "@/lib/rastro";
import { whatsappUrl } from "@/lib/urls";

// Quote for orders in quantity (2026-10-23 for weddings, widened 2026-10-24 to
// companies and parties). The answers become one WhatsApp message. Since
// 2026-10-24 the customer can attach their logo / a photo / a sketch of the
// idea: the request and pictures go to /api/orcamentos (admin "Orçamentos"),
// which returns a short number that rides in the WhatsApp message. Nothing is
// sold here — the atelier answers with a sketch on WhatsApp.

const campo = "mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none";

const TIPOS = [
  { id: "casamento", rotulo: "Casamento", nome: "Nomes dos noivos", exemplo: "Ana e Leo", data: "Data do casamento" },
  { id: "empresa", rotulo: "Empresa ou brinde", nome: "Nome da empresa", exemplo: "Sua empresa", data: "Para quando?" },
  { id: "pousada", rotulo: "Pousada, quiosque ou hotel", nome: "Nome do lugar", exemplo: "Pousada do Sol", data: "Para quando?" },
  { id: "festa", rotulo: "Festa ou aniversário", nome: "Nome de quem é a festa", exemplo: "Maria", data: "Data da festa" },
  { id: "outro", rotulo: "Outro", nome: "Nome do evento", exemplo: "", data: "Para quando?" },
] as const;
type Tipo = (typeof TIPOS)[number]["id"];

const QUANTOS = [
  ["normal", "Cadeiras normais"],
  ["infantil", "Cadeiras infantis"],
  ["reclinavel", "Cadeiras reclináveis"],
] as const;
type Quanto = (typeof QUANTOS)[number][0];

const NOMES = ["O mesmo em todas", "Um nome diferente em cada", "Sem nome", "Ainda não sei"] as const;

const dataBR = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "");

const MAX_IMAGENS = 3;

/**
 * Shrinks a picture in the browser to a ≤1600px JPEG data URL under ~950 KB
 * (logos with transparency get a white background).
 */
async function prepararImagem(arquivo: File): Promise<string> {
  const img = await createImageBitmap(arquivo);
  let lado = 1600;
  try {
    for (;;) {
      const escala = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const url = c.toDataURL("image/jpeg", 0.88);
      if (url.length < 950_000 || lado <= 600) return url;
      lado = Math.round(lado * 0.75);
    }
  } finally {
    img.close();
  }
}

export function OrcamentoEvento({ whatsappNumero }: { whatsappNumero: string }) {
  const [tipo, setTipo] = useState<Tipo>("casamento");
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [cidade, setCidade] = useState("");
  const [qtd, setQtd] = useState<Record<Quanto, number>>({ normal: 2, infantil: 0, reclinavel: 0 });
  const [nomes, setNomes] = useState<(typeof NOMES)[number] | "">("");
  const [cores, setCores] = useState("");
  const [obs, setObs] = useState("");
  const [contato, setContato] = useState("");
  const [seuZap, setSeuZap] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [lendo, setLendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState<{ codigo: string; url: string } | null>(null);
  const campoArquivo = useRef<HTMLInputElement>(null);

  const t = TIPOS.find((x) => x.id === tipo) ?? TIPOS[0];
  const total = qtd.normal + qtd.infantil + qtd.reclinavel;
  const montarMensagem = (codigo: string, enviadas: number) => [
    `Oi! Quero um orçamento de cadeiras para ${t.rotulo.toLowerCase()}.${codigo ? ` (pedido de orçamento ${codigo})` : ""}`,
    contato.trim() && `Meu nome: ${contato.trim()}`,
    nome.trim() && `${t.nome}: ${nome.trim()}`,
    dataBR(data) && `${t.data.replace("?", "")}: ${dataBR(data)}`,
    cidade.trim() && `Cidade: ${cidade.trim()}`,
    ...QUANTOS.filter(([k]) => qtd[k] > 0).map(([k, rotulo]) => `${rotulo}: ${qtd[k]}`),
    `Total: ${total} ${total === 1 ? "cadeira" : "cadeiras"}`,
    nomes && `Nomes nas cadeiras: ${nomes.toLowerCase()}`,
    cores.trim() && `Cores: ${cores.trim()}`,
    obs.trim() && `Ideia: ${obs.trim()}`,
    enviadas
      ? `Mandei ${enviadas === 1 ? "1 imagem" : `${enviadas} imagens`} (logo/ideia) pelo site.`
      : imagens.length
        ? "Tenho imagens da logo/ideia, vou mandar aqui."
        : "",
  ]
    .filter(Boolean)
    .join("\n");

  const escolher = async (lista: FileList | null) => {
    const arquivos = Array.from(lista ?? []).slice(0, MAX_IMAGENS - imagens.length);
    if (!arquivos.length) return;
    setErro("");
    setLendo(true);
    const novas: string[] = [];
    for (const a of arquivos) {
      try {
        novas.push(await prepararImagem(a));
      } catch {
        setErro("Não deu para abrir uma das imagens. Use JPG ou PNG (PDF não dá).");
      }
    }
    setImagens((atuais) => [...atuais, ...novas].slice(0, MAX_IMAGENS));
    setLendo(false);
    if (campoArquivo.current) campoArquivo.current.value = "";
  };

  const enviar = async (form: HTMLFormElement) => {
    setErro("");
    // Opened during the click (popup blockers), pointed at WhatsApp once the request is saved.
    const aba = window.open("", "_blank");
    setEnviando(true);
    let codigo = "";
    let enviadas = 0;
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: t.rotulo.toLowerCase(),
          contato,
          whatsapp: seuZap,
          nomeEvento: nome,
          data,
          cidade,
          qtd,
          nomes,
          cores,
          ideia: obs,
          fotos: imagens,
          site: new FormData(form).get("site"),
          vid: idDaVisita(),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { codigo?: string };
      if (res.ok && j.codigo) {
        codigo = j.codigo;
        enviadas = imagens.length;
      }
    } catch {}
    setEnviando(false);
    const url = whatsappUrl(whatsappNumero, montarMensagem(codigo, enviadas));
    setPronto({ codigo, url });
    if (aba) {
      aba.opener = null;
      aba.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  if (pronto) {
    return (
      <div className="border border-line bg-canvas p-6 text-sm">
        <p className="font-serif text-2xl font-medium tracking-tight text-ink">Pedido enviado!</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          {pronto.codigo ? (
            <>
              O número do seu pedido de orçamento é <strong className="font-mono text-ink">{pronto.codigo}</strong>.{" "}
              {imagens.length ? "Recebemos as suas imagens. " : ""}
            </>
          ) : null}
          Agora é só mandar a mensagem no WhatsApp. O ateliê faz um esboço da cadeira e te manda por lá, com o valor.
        </p>
        <a
          href={pronto.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Abrir o WhatsApp
        </a>
        <button
          type="button"
          onClick={() => {
            setPronto(null);
            setImagens([]);
          }}
          className="mt-3 w-full text-center text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <form
      className="grid grid-cols-2 gap-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar(e.currentTarget);
      }}
    >
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">Seu nome</span>
        <input value={contato} onChange={(e) => setContato(e.target.value)} required maxLength={60} autoComplete="name" className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">Seu WhatsApp (opcional)</span>
        <input
          value={seuZap}
          onChange={(e) => setSeuZap(e.target.value)}
          type="tel"
          inputMode="tel"
          maxLength={20}
          autoComplete="tel"
          placeholder="(27) 99999-9999"
          className={campo}
        />
      </label>
      <fieldset className="col-span-2">
        <legend className="text-ink-soft">O que é?</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TIPOS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={tipo === x.id}
              onClick={() => setTipo(x.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                tipo === x.id ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-ink"
              }`}
            >
              {x.rotulo}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="col-span-2">
        <span className="text-ink-soft">{t.nome}</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder={t.exemplo} className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">{t.data}</span>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
      </label>
      <label className="max-sm:col-span-2">
        <span className="text-ink-soft">Cidade</span>
        <input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={60} autoComplete="address-level2" className={campo} />
      </label>
      <fieldset className="col-span-2 mt-1 space-y-2 border-t border-line pt-3">
        <legend className="sr-only">Quantas cadeiras</legend>
        {QUANTOS.map(([k, rotulo]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-ink">{rotulo}</span>
            <span className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQtd((q) => ({ ...q, [k]: Math.max(0, q[k] - 1) }))}
                className="h-10 w-10 text-lg text-ink-soft hover:text-ink"
                aria-label={`Menos ${rotulo.toLowerCase()}`}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                value={qtd[k]}
                onChange={(e) => setQtd((q) => ({ ...q, [k]: Math.max(0, Math.min(500, Math.floor(Number(e.target.value) || 0))) }))}
                className="w-12 bg-transparent text-center tabular-nums text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label={rotulo}
              />
              <button
                type="button"
                onClick={() => setQtd((q) => ({ ...q, [k]: Math.min(500, q[k] + 1) }))}
                className="h-10 w-10 text-lg text-ink-soft hover:text-ink"
                aria-label={`Mais ${rotulo.toLowerCase()}`}
              >
                +
              </button>
            </span>
          </div>
        ))}
        <p className="text-right text-xs text-ink-soft">
          Total: {total} {total === 1 ? "cadeira" : "cadeiras"}
        </p>
      </fieldset>
      <label className="col-span-2">
        <span className="text-ink-soft">Nomes nas cadeiras</span>
        <select value={nomes} onChange={(e) => setNomes(e.target.value as typeof nomes)} className={campo}>
          <option value="">Escolha…</option>
          {NOMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2">
        <span className="text-ink-soft">Cores (opcional)</span>
        <input
          value={cores}
          onChange={(e) => setCores(e.target.value)}
          maxLength={80}
          placeholder={tipo === "empresa" || tipo === "pousada" ? "As cores da marca" : "Branco e dourado"}
          className={campo}
        />
      </label>
      <div className="col-span-2">
        <span className="text-ink-soft">Logo, foto ou desenho da ideia (opcional, até {MAX_IMAGENS})</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {imagens.map((src, i) => (
            <span key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img src={src} alt={`Imagem ${i + 1}`} className="h-20 w-20 border border-line bg-white object-contain" />
              <button
                type="button"
                onClick={() => setImagens((l) => l.filter((_, k) => k !== i))}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-canvas"
                aria-label={`Tirar a imagem ${i + 1}`}
              >
                ✕
              </button>
            </span>
          ))}
          {imagens.length < MAX_IMAGENS ? (
            <label className="flex h-20 cursor-pointer items-center justify-center border border-dashed border-ink-soft px-4 text-center text-xs text-ink transition-colors hover:border-ink">
              {lendo ? "Abrindo…" : imagens.length ? "+ Outra imagem" : "+ Escolher imagem"}
              <input ref={campoArquivo} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void escolher(e.target.files)} />
            </label>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-ink-soft">Pode ser a logo da empresa, uma foto de referência ou um rabisco. O ateliê faz o esboço da cadeira com ela.</p>
      </div>
      <label className="col-span-2">
        <span className="text-ink-soft">Conte a ideia (opcional)</span>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Ex.: logo no encosto, nome da empresa no assento"
          className={campo}
        />
      </label>
      {erro ? <p className="col-span-2 text-sm text-clay-dark">{erro}</p> : null}
      <button
        type="submit"
        disabled={total === 0 || enviando || lendo}
        data-rastro="Orçamento de evento"
        className="col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-50"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {enviando ? (imagens.length ? "Enviando as imagens…" : "Enviando…") : "Pedir orçamento no WhatsApp"}
      </button>
    </form>
  );
}
