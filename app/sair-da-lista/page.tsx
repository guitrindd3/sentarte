import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { emailDoLinkSair, removerEmail } from "@/lib/lista-email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sair da lista de e-mails",
  robots: { index: false, follow: false },
};

// The link at the bottom of every list e-mail (lib/lista-email.ts linkSair).
// Leaving takes a button press, not just opening the link: e-mail security
// scanners open every link, and that alone must not unsubscribe anyone.
// (Gmail's own "cancelar inscrição" uses POST /api/sair — one click.)

async function sair(formData: FormData) {
  "use server";
  const email = emailDoLinkSair(formData.get("e"), formData.get("t"));
  if (email) await removerEmail(email);
  redirect(email ? "/sair-da-lista?feito=1" : "/sair-da-lista");
}

export default async function SairDaLista({ searchParams }: PageProps<"/sair-da-lista">) {
  const q = await searchParams;
  const feito = q.feito === "1";
  const e = typeof q.e === "string" ? q.e : "";
  const t = typeof q.t === "string" ? q.t : "";
  const email = emailDoLinkSair(e, t);
  return (
    <>
      <PageHeader
        titulo={feito ? "Pronto, você saiu da lista" : "Sair da lista de e-mails"}
        resumo={
          feito
            ? "Você não vai mais receber novidades e cupons por e-mail. Os e-mails sobre um pedido que você fizer continuam chegando normalmente."
            : email
              ? `O e-mail ${email} vai parar de receber novidades e cupons do Ateliê SentArte.`
              : "Esse link não está completo. Abra de novo pelo botão no fim do e-mail, ou peça pelo WhatsApp que a gente tira você da lista."
        }
      />
      <section className="mx-auto max-w-xl px-6 py-14">
        {!feito && email ? (
          <form action={sair}>
            <input type="hidden" name="e" value={e} />
            <input type="hidden" name="t" value={t} />
            <button type="submit" className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas hover:bg-ink/85">
              Sair da lista
            </button>
          </form>
        ) : null}
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-ink underline underline-offset-4">
          Voltar para a loja
        </Link>
      </section>
    </>
  );
}
