import api from "./api";

/**
 * Notificações push neste aparelho.
 *
 * - O service worker (/sw.js) é registrado quando o app abre.
 * - Ativar pede permissão (precisa ser num toque da pessoa, exigência do
 *   iPhone) e envia a inscrição do aparelho para o servidor.
 * - Ao sair da conta, a inscrição é removida: quem entrar depois no mesmo
 *   aparelho não recebe as mensagens da conta anterior.
 *
 * No iPhone só funciona com o app instalado na Tela de Início (iOS 16.4+).
 */
const ENABLED_KEY = "pushEnabled";

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const isIos = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export const pushPermission = () =>
  pushSupported() ? Notification.permission : "unsupported";

export const isPushActive = () => {
  try {
    return (
      localStorage.getItem(ENABLED_KEY) === "1" &&
      pushPermission() === "granted"
    );
  } catch (err) {
    return false;
  }
};

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
};

const toKey = base64 => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
};

const currentSubscription = async () => {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

const sendSubscription = async (subscription, silent) => {
  await api.post("/push/subscriptions", {
    subscription: subscription.toJSON(),
    silent
  });
  localStorage.setItem(ENABLED_KEY, "1");
};

export const enablePush = async ({ silent = false } = {}) => {
  if (!pushSupported()) throw new Error("unsupported");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission);

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await api.get("/push/public-key");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toKey(data.publicKey)
    });
  }
  await sendSubscription(subscription, silent);
};

// app aberto já com permissão dada: confirma a inscrição para quem está logado
export const syncPush = async ({ silent = false } = {}) => {
  if (!pushSupported() || Notification.permission !== "granted") return;
  if (localStorage.getItem(ENABLED_KEY) !== "1") return;
  try {
    const subscription = await currentSubscription();
    if (subscription) {
      await sendSubscription(subscription, silent);
    } else {
      await enablePush({ silent });
    }
  } catch (err) {
    // sem conexão ou serviço de push fora: tenta de novo na próxima abertura
  }
};

export const setPushSilent = async silent => {
  if (!isPushActive()) return;
  try {
    const subscription = await currentSubscription();
    if (subscription) {
      await api.put("/push/subscriptions", {
        endpoint: subscription.endpoint,
        silent
      });
    }
  } catch (err) {
    // preferência volta a ser enviada no próximo syncPush
  }
};

export const forgetPushForUser = async () => {
  if (!pushSupported()) return;
  try {
    const subscription = await currentSubscription();
    if (subscription) {
      await api.delete("/push/subscriptions", {
        data: { endpoint: subscription.endpoint }
      });
    }
  } catch (err) {
    // sem inscrição ou sem rede: nada a fazer
  }
};
