import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const ConnectionStatus = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let interval;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('/api/health', { signal: controller.signal });
        clearTimeout(timeout);

        if (isOffline) {
          setIsOffline(false);
          setShowReconnected(true);
          setTimeout(() => setShowReconnected(false), 3000);
        }
      } catch {
        setIsOffline(true);
        setWasOffline(true);
      }
    };

    // Check immediately on mount
    checkHealth();

    // Then poll every 30 seconds
    interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [isOffline]);

  if (!isOffline && !showReconnected) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 20px',
      fontSize: '0.78rem',
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      letterSpacing: '0.3px',
      transition: 'all 0.5s var(--ease-out-expo)',
      animation: 'slideDownBar 0.4s var(--ease-out-expo) forwards',
      background: isOffline
        ? 'linear-gradient(90deg, rgba(225,29,72,0.95), rgba(239,68,68,0.95))'
        : 'linear-gradient(90deg, rgba(16,185,129,0.95), rgba(14,165,233,0.95))',
      color: '#fff',
      backdropFilter: 'blur(12px)',
      boxShadow: isOffline
        ? '0 2px 20px rgba(225,29,72,0.3)'
        : '0 2px 20px rgba(16,185,129,0.3)',
    }}>
      {isOffline ? (
        <>
          <WifiOff size={14} />
          <span>Backend Offline — Beberapa fitur mungkin tidak tersedia</span>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#fff', animation: 'pulseDot 1.5s ease-in-out infinite',
          }} />
        </>
      ) : (
        <>
          <Wifi size={14} />
          <span>Koneksi berhasil dipulihkan</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
