/**
 * Identificador aleatório deste navegador, guardado nele mesmo. O servidor
 * usa para saber se o navegador já foi liberado com o código do e-mail
 * (guarda só um hash). Limpar os dados do site = navegador novo.
 */
const KEY = "tkv:device";
const VALID = /^[A-Za-z0-9_-]{16,100}$/;

const randomId = () => {
  const bytes = new Uint8Array(24);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};

export const getDeviceId = () => {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !VALID.test(id)) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch (err) {
    return "";
  }
};
