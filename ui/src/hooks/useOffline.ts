import { useState, useEffect } from 'react';
import { useToast } from './useToast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const { addToast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const start = Date.now();
        // Use a small, reliable endpoint for connectivity check
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const latency = Date.now() - start;

        if (latency < 1000) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
          if (connectionQuality === 'good') {
            addToast('Connection quality degraded', 'warning');
          }
        }
      } catch (error) {
        setConnectionQuality('offline');
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      addToast('Connection restored', 'success');
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      addToast('Connection lost - operating in offline mode', 'warning');
    };

    // Initial check
    checkConnection();

    // Periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast, connectionQuality]);

  return { isOnline, connectionQuality };
};