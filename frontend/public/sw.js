/* Service worker do Tekvosoft: notificações push.
 *
 * O servidor manda { title, body, icon, tag, url, silent } quando chega
 * mensagem nova. Aqui a notificação é mostrada com o nome e a foto de quem
 * mandou (como no WhatsApp) e, ao tocar, abre a conversa.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "Nova mensagem", body: event.data && event.data.text() };
  }

  const show = async () => {
    const url = data.url || "/tickets";
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    // a pessoa já está com essa conversa aberta na frente: não interrompe
    const alreadyOpen = windows.some(client => {
      try {
        return client.focused && new URL(client.url).pathname === url;
      } catch (err) {
        return false;
      }
    });
    if (alreadyOpen) return;

    await self.registration.showNotification(data.title || "Nova mensagem", {
      body: data.body || "",
      icon: data.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      tag: data.tag,
      renotify: !!data.tag,
      silent: !!data.silent,
      // Android: o celular vibra com o mesmo padrão de "mensagem nova" do app
      vibrate: data.silent ? undefined : [18, 110, 18],
      timestamp: Date.now(),
      data: { url }
    });
  };

  event.waitUntil(show());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      const client = windows.find(item => "focus" in item);
      if (client) {
        await client.focus();
        client.postMessage({ type: "tkv:navigate", url });
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
