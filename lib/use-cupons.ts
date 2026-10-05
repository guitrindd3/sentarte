"use client";

import { useEffect, useState } from "react";
import type { CupomPublico } from "./cupom";

const CHAVE = "sentarte-cupom";

/**
 * Coupons in the cart: the automatic ones (fetched from /api/cupom) plus the
 * one the customer typed (remembered in localStorage and re-checked on load).
 */
export function useCupons() {
  const [automaticos, setAutomaticos] = useState<CupomPublico[]>([]);
  const [digitado, setDigitado] = useState<CupomPublico | null>(null);
  const [erro, setErro] = useState("");
  const [conferindo, setConferindo] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch("/api/cupom", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { automaticos?: CupomPublico[] }) => vivo && setAutomaticos(j.automaticos ?? []))
      .catch(() => {});
    let guardado = "";
    try {
      guardado = localStorage.getItem(CHAVE) ?? "";
    } catch {}
    if (guardado) {
      fetch(`/api/cupom?codigo=${encodeURIComponent(guardado)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { cupom?: CupomPublico }) => {
          if (!vivo) return;
          if (j.cupom) setDigitado(j.cupom);
          else {
            try {
              localStorage.removeItem(CHAVE);
            } catch {}
          }
        })
        .catch(() => {});
    }
    return () => {
      vivo = false;
    };
  }, []);

  const aplicar = async (codigo: string) => {
    setErro("");
    setConferindo(true);
    try {
      const r = await fetch(`/api/cupom?codigo=${encodeURIComponent(codigo)}`, { cache: "no-store" });
      const j = (await r.json()) as { cupom?: CupomPublico; erro?: string };
      if (!j.cupom) {
        setErro(j.erro ?? "Cupom não encontrado.");
        return false;
      }
      setDigitado(j.cupom);
      try {
        localStorage.setItem(CHAVE, j.cupom.codigo);
      } catch {}
      return true;
    } catch {
      setErro("Não deu para conferir o cupom agora.");
      return false;
    } finally {
      setConferindo(false);
    }
  };

  const remover = () => {
    setDigitado(null);
    setErro("");
    try {
      localStorage.removeItem(CHAVE);
    } catch {}
  };

  const cupons = digitado && !automaticos.some((c) => c.codigo === digitado.codigo) ? [...automaticos, digitado] : automaticos;
  return { automaticos, digitado, cupons, erro, conferindo, aplicar, remover };
}
