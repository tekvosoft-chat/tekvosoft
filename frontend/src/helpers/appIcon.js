import { getBackendURL } from "../services/config";

/**
 * Ícone do app na cor do tema da empresa (só para quem está logado).
 *
 * O balão continua branco e o fundo — que é preto no padrão — passa a ser a
 * cor escolhida em Aparência: na aba do navegador, no manifesto do app
 * instalado (Android) e no ícone da tela de início do iPhone. A escolha fica
 * guardada para o index.html já apontar para ela antes do app carregar (é
 * nesse momento que o navegador lê o manifesto). Sem tema, volta ao preto.
 */
const STORE = "tkvAppIcon";

export const applyAppIcon = color => {
  const hex = /^#?[0-9a-f]{6}$/i.test(color || "")
    ? color.replace("#", "").toLowerCase()
    : null;
  const base = getBackendURL();
  const links = hex
    ? {
        manifest: `/manifest.json?bg=${hex}`,
        apple: `${base}/pwa-icon.png?bg=${hex}&size=180&shape=full`,
        tab: `${base}/pwa-icon.png?bg=${hex}&size=64&shape=tab`
      }
    : null;

  try {
    if (links) localStorage.setItem(STORE, JSON.stringify(links));
    else localStorage.removeItem(STORE);
  } catch (err) {
    // sem armazenamento: vale só nesta visita
  }

  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest)
    manifest.setAttribute("href", links ? links.manifest : "/manifest.json");
  const apple = document.querySelector('link[rel="apple-touch-icon"]');
  if (apple)
    apple.setAttribute("href", links ? links.apple : "/apple-touch-icon.png");

  return links ? links.tab : null;
};
