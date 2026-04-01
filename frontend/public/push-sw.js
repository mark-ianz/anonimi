self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "New notification";
  const body = payload.body || "";
  const data = payload.data || {};
  const url = data.href || "/chat";
  const iconUrl = data.iconUrl || "/file.svg";
  const imageUrl = data.imageUrl || undefined;
  const conversationId = data.conversationId || undefined;

  const show = async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasVisibleClient = clientsList.some(
      (client) => client.visibilityState === "visible"
    );

    if (hasVisibleClient) return;

    await self.registration.showNotification(title, {
      body,
      data: { url, conversationId },
      tag: conversationId,
      icon: iconUrl,
      image: imageUrl,
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

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "close-notifications") return;

  const conversationId = data.conversationId;
  const close = async () => {
    const notifications = await self.registration.getNotifications({
      tag: conversationId,
    });
    notifications.forEach((notification) => notification.close());
  };

  event.waitUntil(close());
});
