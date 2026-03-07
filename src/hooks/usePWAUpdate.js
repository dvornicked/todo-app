import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker activated, reload to use new version
        window.location.reload();
      });
    }
  }, []);

  const onNeedRefresh = () => {
    setNeedRefresh(true);
  };

  const onOfflineReady = () => {
    setOfflineReady(true);
    // Hide the offline ready message after 3 seconds
    setTimeout(() => setOfflineReady(false), 3000);
  };

  const closePrompt = () => {
    setNeedRefresh(false);
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  };

  return {
    needRefresh,
    offlineReady,
    onNeedRefresh,
    onOfflineReady,
    closePrompt,
    updateServiceWorker,
  };
}
