const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const isPushSupported = (): boolean => {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
};

export const registerPushServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  return navigator.serviceWorker.register("/push-sw.js");
};

export const getExistingPushSubscription = async (
  registration: ServiceWorkerRegistration
) => {
  return registration.pushManager.getSubscription();
};

export const subscribeToPush = async (publicKey: string) => {
  const registration = await registerPushServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
};

export const unsubscribeFromPush = async (): Promise<string | null> => {
  const registration = await registerPushServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
};
