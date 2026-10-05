# SentArte

Site do Ateliê SentArte — cadeiras de praia trançadas à mão — em https://sentarte.vercel.app

- Next.js 16 (App Router) + Tailwind v4, publicado na Vercel (cada push no `main` publica sozinho).
- Painel do ateliê em `/admin` (conteúdo salvo no próprio repositório via GitHub; estatísticas, cupons, clientes e segurança no Upstash Redis).
- Notas completas do projeto (decisões, onde fica cada coisa, como testar): [`CLAUDE.md`](./CLAUDE.md).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # confere tipos e gera a versão de produção
```
