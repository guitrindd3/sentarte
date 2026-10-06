"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import type { CartItem } from "@/lib/cart-context";
import type { CupomPublico } from "@/lib/cupom";
import { formatBRL, PARCELAS_MAX, PIX_DESCONTO } from "@/lib/offer";
import { idDaVisita } from "@/lib/rastro";
import { PixNoSite, type PixGerado } from "@/components/pix-no-site";
import { CartaoNoSite, PUBLIC_KEY_MP } from "@/components/cartao-no-site";
import { guardarCep, textoFrete, useFrete } from "@/lib/use-frete";
import {
  calcularPedido,
  ENTREGA_VAZIA,
  entregaCompleta,
  PEDIDO_STORAGE_KEY,
  type DadosEntrega,
  type PedidoSalvo,
} from "@/lib/pedido";

const ENTREGA_KEY = "sentarte-entrega";

function carregarEntrega(): DadosEntrega {
  try {
    const raw = window.localStorage.getItem(ENTREGA_KEY);
    return raw ? { ...ENTREGA_VAZIA, ...(JSON.parse(raw) as Partial<DadosEntrega>) } : ENTREGA_VAZIA;
  } catch {
    return ENTREGA_VAZIA;
  }
}

// Delivery details + "pay with Pix / card" inside the cart drawer. Sends the
// cart to /api/checkout, which creates the Mercado Pago payment, and then
// redirects there. The order summary is kept in localStorage so /pedido can
// show it (and send it to WhatsApp) when Mercado Pago sends the buyer back.
export function CheckoutForm({
  items,
  cupons,
  codigoDigitado,
  onVoltar,
}: {
  items: CartItem[];
  cupons: CupomPublico[];
  /** The code the customer typed; the server re-checks it before charging. */
  codigoDigitado?: string;
  onVoltar: () => void;
}) {
  const [d, setD] = useState<DadosEntrega>(carregarEntrega);
  const [enviando, setEnviando] = useState<"pix" | "cartao" | null>(null);
  const [erro, setErro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [pix, setPix] = useState<PixGerado | null>(null);
  // Card inside the site (Mercado Pago Card Payment Brick) once the public key exists.
  const [cartao, setCartao] = useState<{ referencia: string } | null>(null);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email ?? "").trim());
  const conta = calcularPedido(items, cupons);
  const estadoFrete = useFrete(d.cep, items);
  const valorFrete = estadoFrete.tipo === "ok" ? estadoFrete.frete.valor : null;
  const ok = entregaCompleta(d) && valorFrete !== null;

  const set = (campo: keyof DadosEntrega) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setD((v) => ({ ...v, [campo]: e.target.value }));

  const buscarCep = async (cep: string) => {
    const so = cep.replace(/\D/g, "");
    if (so.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${so}/json/`);
      const j = (await r.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!j.erro) {
        setD((v) => ({
          ...v,
          endereco: v.endereco || j.logradouro || "",
          bairro: v.bairro || j.bairro || "",
          cidade: j.localidade || v.cidade,
          uf: j.uf || v.uf,
        }));
      }
    } catch {
      // CEP lookup is only a convenience
    } finally {
      setBuscandoCep(false);
    }
  };

  const itensDoPedido = () =>
    items.map((i) => ({
      categoriaSlug: i.categoriaSlug,
      categoriaTitulo: i.categoriaTitulo,
      modeloNome: i.modeloNome,
      quantidade: i.quantidade,
      nomePersonalizado: i.nomePersonalizado,
      variante: i.variante,
      tipoCadeira: i.tipoCadeira,
    }));

  const pagar = async (forma: "pix" | "cartao", naPaginaDoMercadoPago = false) => {
    setErro("");
    if (forma === "cartao" && PUBLIC_KEY_MP && !naPaginaDoMercadoPago) {
      // Card form opens right here; the order summary is kept for /pedido.
      const referencia = crypto.randomUUID();
      try {
        window.localStorage.setItem(ENTREGA_KEY, JSON.stringify(d));
        const salvo: PedidoSalvo = { referencia, forma, itens: itensDoPedido(), entrega: d, total: conta.total + (valorFrete ?? 0) };
        window.localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(salvo));
      } catch {}
      setCartao({ referencia });
      return;
    }
    setEnviando(forma);
    const referencia = crypto.randomUUID();
    const itens = items.map((i) => ({
      categoriaSlug: i.categoriaSlug,
      categoriaTitulo: i.categoriaTitulo,
      modeloNome: i.modeloNome,
      quantidade: i.quantidade,
      nomePersonalizado: i.nomePersonalizado,
      variante: i.variante,
      tipoCadeira: i.tipoCadeira,
    }));
    try {
      window.localStorage.setItem(ENTREGA_KEY, JSON.stringify(d));
      if (forma === "pix") {
        // Pix is paid right here (QR code / copia e cola), no Mercado Pago page.
        const r = await fetch("/api/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itens, entrega: d, email: d.email, referencia, vid: idDaVisita(), cupom: codigoDigitado }),
        });
        const p = (await r.json()) as Partial<PixGerado> & { erro?: string };
        if (!r.ok || !p.id || !p.copiaECola) throw new Error(p.erro || "Não deu para gerar o Pix agora.");
        const salvoPix: PedidoSalvo = { referencia: p.referencia ?? referencia, forma, itens, entrega: d, total: p.valor ?? conta.totalPix };
        window.localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(salvoPix));
        setPix(p as PixGerado);
        setEnviando(null);
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forma, itens, entrega: d, referencia, vid: idDaVisita(), cupom: codigoDigitado }),
      });
      const j = (await res.json()) as { url?: string; erro?: string; valor?: number };
      if (!res.ok || !j.url) throw new Error(j.erro || "Não foi possível abrir o pagamento.");
      const salvo: PedidoSalvo = { referencia, forma, itens, entrega: d, total: j.valor ?? conta.total };
      window.localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(salvo));
      window.location.href = j.url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir o pagamento.");
      setEnviando(null);
    }
  };

  const campo = "mt-1 w-full border border-line bg-canvas px-3 py-2 text-base text-ink focus:border-ink focus:outline-none";

  if (cartao) {
    return (
      <CartaoNoSite
        valor={Math.round((conta.total + (valorFrete ?? 0)) * 100) / 100}
        email={(d.email ?? "").trim()}
        corpoPedido={{ itens: itensDoPedido(), entrega: d, referencia: cartao.referencia, vid: idDaVisita(), cupom: codigoDigitado }}
        onVoltar={() => setCartao(null)}
        onPaginaMercadoPago={() => {
          setCartao(null);
          void pagar("cartao", true);
        }}
      />
    );
  }

  if (pix) {
    return (
      <PixNoSite
        pix={pix}
        onCancelar={() => setPix(null)}
        onNovo={() => {
          setPix(null);
          void pagar("pix");
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <button type="button" onClick={onVoltar} className="-ml-1 inline-flex items-center gap-1 py-1 text-sm text-ink-soft hover:text-ink">
          <ChevronDownIcon className="h-4 w-4 rotate-90" />
          Voltar ao carrinho
        </button>
        <p className="mt-2 font-serif text-lg font-medium text-ink">Dados para entrega</p>
        <p className="text-xs text-ink-soft">O frete é calculado pelo CEP.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2">
            <span className="text-ink-soft">Nome completo</span>
            <input value={d.nome} onChange={set("nome")} autoComplete="name" className={campo} />
          </label>
          <label className="col-span-2">
            <span className="text-ink-soft">WhatsApp</span>
            <input value={d.telefone} onChange={set("telefone")} inputMode="tel" autoComplete="tel" placeholder="(27) 99999-9999" className={campo} />
          </label>
          <label className="col-span-2">
            <span className="text-ink-soft">E-mail (para o comprovante)</span>
            <input value={d.email ?? ""} onChange={set("email")} type="email" inputMode="email" autoComplete="email" placeholder="voce@email.com" className={campo} />
          </label>
          <label>
            <span className="text-ink-soft">CEP {buscandoCep ? "…" : ""}</span>
            <input
              value={d.cep}
              onChange={(e) => {
                set("cep")(e);
                guardarCep(e.target.value);
                void buscarCep(e.target.value);
              }}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              className={campo}
            />
          </label>
          <label>
            <span className="text-ink-soft">Número</span>
            <input value={d.numero} onChange={set("numero")} inputMode="numeric" className={campo} />
          </label>
          <label className="col-span-2">
            <span className="text-ink-soft">Rua / avenida</span>
            <input value={d.endereco} onChange={set("endereco")} autoComplete="address-line1" className={campo} />
          </label>
          <label className="col-span-2">
            <span className="text-ink-soft">Complemento (opcional)</span>
            <input value={d.complemento} onChange={set("complemento")} autoComplete="address-line2" className={campo} />
          </label>
          <label className="col-span-2">
            <span className="text-ink-soft">Bairro</span>
            <input value={d.bairro} onChange={set("bairro")} className={campo} />
          </label>
          <label>
            <span className="text-ink-soft">Cidade</span>
            <input value={d.cidade} onChange={set("cidade")} autoComplete="address-level2" className={campo} />
          </label>
          <label>
            <span className="text-ink-soft">UF</span>
            <input value={d.uf} onChange={set("uf")} maxLength={2} autoComplete="address-level1" className={`${campo} uppercase`} />
          </label>
        </div>
      </div>

      <div className="border-t border-line px-6 py-4">
        {erro ? <p className="mb-3 text-sm text-clay">{erro}</p> : null}
        <div className="mb-3 flex justify-between text-sm text-ink-soft">
          <span>Frete</span>
          <span>{textoFrete(estadoFrete) ?? formatBRL(valorFrete ?? 0)}</span>
        </div>
        {estadoFrete.tipo === "indisponivel" ? (
          <p className="mb-3 text-xs text-ink">
            Para esse CEP a gente calcula o frete pelo WhatsApp. Volte ao carrinho e feche por lá.
          </p>
        ) : !ok ? (
          <p className="mb-3 text-xs text-ink-soft">Preencha os dados acima para pagar.</p>
        ) : !emailOk ? (
          <p className="mb-3 text-xs text-ink-soft">Coloque o seu e-mail: o comprovante do pagamento vai para ele.</p>
        ) : null}
        <button
          type="button"
          disabled={!ok || !emailOk || enviando !== null}
          onClick={() => pagar("pix")}
          className="flex w-full items-center justify-between rounded-full bg-verde px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-escuro disabled:opacity-40"
        >
          <span>{enviando === "pix" ? "Gerando o Pix…" : `Pagar no Pix (${Math.round(PIX_DESCONTO * 100)}% off)`}</span>
          <span>{formatBRL(conta.totalPix + (valorFrete ?? 0))}</span>
        </button>
        <button
          type="button"
          disabled={!ok || (Boolean(PUBLIC_KEY_MP) && !emailOk) || enviando !== null}
          onClick={() => pagar("cartao")}
          className="mt-2 flex w-full items-center justify-between rounded-full border-2 border-verde px-5 py-3 text-sm font-semibold text-verde-escuro transition-colors hover:bg-verde/5 disabled:opacity-40"
        >
          <span>{enviando === "cartao" ? "Abrindo…" : `Cartão em até ${PARCELAS_MAX}x`}</span>
          <span>{formatBRL(conta.total + (valorFrete ?? 0))}</span>
        </button>
        <p className="mt-3 text-center text-[0.7rem] leading-snug text-ink-soft">
          Pagamento seguro pelo Mercado Pago. Depois de pagar, você volta para cá e manda o resumo no WhatsApp.
        </p>
        <p className="mt-2 text-center text-[0.7rem] leading-snug text-ink-soft">
          Seu nome, WhatsApp e o pedido ficam guardados para a gente falar com você sobre ele.{" "}
          <a href="/politica-de-privacidade" target="_blank" className="underline underline-offset-2">Privacidade</a>
        </p>
      </div>
    </div>
  );
}
