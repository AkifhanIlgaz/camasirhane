// Push bildirimlerini gösterir (FCM). Firebase SDK'sı gerekmez; FCM yükü JSON olarak gelir.
self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const n = payload.notification || payload.data || {};
  const data = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(n.title || "Çamaşırhane", {
      body: n.body || "",
      icon: "/favicon.ico",
      tag: data.requestId || undefined,
      data: { link: data.link || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(link).catch(() => {});

          return client.focus();
        }
      }

      return self.clients.openWindow(link);
    }),
  );
});
