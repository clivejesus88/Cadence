import { registerSW } from 'virtual:pwa-register';
import { notifyUpdateReady, notifyOfflineReady } from './utils/notify';

export function initPWA(): void {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      notifyUpdateReady(() => {
        void updateSW(true);
      });
    },
    onOfflineReady() {
      notifyOfflineReady();
    }
  });
}
