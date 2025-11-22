import { useState, useEffect } from 'react';

interface BrowserSupport {
  bluetooth: boolean;
  https: boolean;
  supported: boolean;
  browserName: string;
}

export function BrowserCheck() {
  const [support, setSupport] = useState<BrowserSupport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const bluetooth = 'bluetooth' in navigator;
      const https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

      // Detect browser
      const ua = navigator.userAgent;
      let browserName = 'Unknown';
      if (ua.includes('Chrome') && !ua.includes('Edg')) browserName = 'Chrome';
      else if (ua.includes('Edg')) browserName = 'Edge';
      else if (ua.includes('OPR') || ua.includes('Opera')) browserName = 'Opera';
      else if (ua.includes('Firefox')) browserName = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'Safari';

      const supported = bluetooth && https && (browserName === 'Chrome' || browserName === 'Edge' || browserName === 'Opera');

      setSupport({ bluetooth, https, supported, browserName });
    };

    checkSupport();
  }, []);

  if (!support || dismissed || support.supported) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '12px 16px',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px',
    }}>
      <div>
        {!support.bluetooth && (
          <div>
            <strong>⚠️ Web Bluetooth Not Supported</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Your browser doesn't support Web Bluetooth. Please use Chrome, Edge, or Opera.
              {support.browserName && ` (Current: ${support.browserName})`}
            </p>
          </div>
        )}
        {support.bluetooth && !support.https && (
          <div>
            <strong>⚠️ HTTPS Required</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Web Bluetooth requires HTTPS. Please access this app via https:// or localhost.
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '16px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
