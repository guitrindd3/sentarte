import { estadoVagas } from "@/lib/vagas";

// Public: this week's production slots, for the product page and the cart.
export async function GET() {
  try {
    const v = await estadoVagas();
    return Response.json(v.ligado ? { ligado: true, restantes: v.restantes } : { ligado: false }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json({ ligado: false });
  }
}
