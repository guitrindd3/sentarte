export function whatsappUrl(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function instagramUrl(handle: string) {
  return `https://instagram.com/${handle}`;
}
