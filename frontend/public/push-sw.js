self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "New notification";
  const body = payload.body || "";
  const data = payload.data || {};
  const url = data.href || "/chat";

  const show = async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasVisibleClient = clientsList.some(
      (client) => client.visibilityState === "visible"
    );

    if (hasVisibleClient) return;

    await self.registration.showNotification(title, {
      body,
      data: { url },
      icon: "/file.svg",
      badge: "/file.svg",
    });
  };

  event.waitUntil(show());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/chat";

  const open = async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clientsList.find((client) => client.url.includes(targetUrl));
    if (existing) {
      await existing.focus();
      return;
    }
    await self.clients.openWindow(targetUrl);
  };

  event.waitUntil(open());
});
