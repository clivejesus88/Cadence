/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigation fallback, except API/auth paths.
const navigationRoute = new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api/, /\/auth/]
});
registerRoute(navigationRoute);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 })]
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 })]
  })
);

// Never cache Supabase API calls.
registerRoute(/^https:\/\/[a-z0-9-]+\.supabase\.co\/.*/i, new NetworkOnly());

interface PushData {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushData = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Cadence', body: event.data?.text() ?? '' };
  }

  const title = data.title ?? 'Cadence';
  const options: NotificationOptions = {
    body: data.body ?? '',
    tag: data.tag ?? 'cadence',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url ?? '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) ?? '/';
  const url = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return (client as WindowClient).focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// Allow the page to trigger an immediate skip-waiting on user request.
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
