import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ateliê SentArte",
    short_name: "SentArte",
    description: "Cadeiras de praia personalizadas, trançadas à mão. Frete grátis para todo o Brasil.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#faf7f2",
    lang: "pt-BR",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/brand/logo.png", sizes: "1024x1024", type: "image/png" },
    ],
  };
}
