// ─── Focus Now — Service Worker Notification Engine ────────────────────────
// Handles background push notifications for:
//   • Daily time-block reminders (Morning / Afternoon / Evening / Night)
//   • Motivational quote blasts (3× per day)
//   • Task-specific reminders set by the user

const SW_VERSION = 'focus-now-sw-v2';

// Stores all pending setTimeout handles (id → timerId)
const scheduledTimers = new Map();

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Message Handler ───────────────────────────────────────────────────────────
// The app sends messages via: registration.active.postMessage({ type, payload })

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      scheduleOne(payload);
      break;

    case 'SCHEDULE_BATCH':
      // payload = array of notification objects
      if (Array.isArray(payload)) payload.forEach(scheduleOne);
      break;

    case 'CANCEL_NOTIFICATION':
      cancelOne(payload?.id);
      break;

    case 'CANCEL_ALL':
      cancelAll();
      break;

    case 'PING':
      // Health-check — page can verify SW is alive
      if (event.source) {
        event.source.postMessage({ type: 'PONG', version: SW_VERSION });
      }
      break;

    default:
      break;
  }
});

// ── Core scheduler ────────────────────────────────────────────────────────────

function scheduleOne({ id, title, body, icon, badge, tag, msUntil, vibrate, requireInteraction }) {
  if (!id || typeof msUntil !== 'number' || msUntil <= 0) return;

  // Replace if already scheduled
  cancelOne(id);

  const timerId = setTimeout(async () => {
    scheduledTimers.delete(id);
    await fireNotification({ id, title, body, icon, badge, tag, vibrate, requireInteraction });
  }, msUntil);

  scheduledTimers.set(id, timerId);
}

async function fireNotification({ id, title, body, icon, badge, tag, vibrate, requireInteraction }) {
  try {
    await self.registration.showNotification(title, {
      body: body || '',
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      tag: tag || id,
      vibrate: vibrate || [200, 80, 200, 80, 200],
      requireInteraction: requireInteraction || false,
      data: { id, openUrl: '/' },
      actions: [
        { action: 'open',    title: '📅 Open Scheduler' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  } catch (err) {
    console.warn('[SW] showNotification error:', err);
  }
}

function cancelOne(id) {
  if (!id || !scheduledTimers.has(id)) return;
  clearTimeout(scheduledTimers.get(id));
  scheduledTimers.delete(id);
}

function cancelAll() {
  scheduledTimers.forEach((t) => clearTimeout(t));
  scheduledTimers.clear();
}

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.openUrl || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            return;
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ── Notification close ────────────────────────────────────────────────────────

self.addEventListener('notificationclose', () => {
  // Intentionally empty — could track dismissals if needed
});
