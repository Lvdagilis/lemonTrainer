import { useState, useEffect } from 'react';
import './BrowserCheck.css';

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
    <div className="browser-check-banner">
      <div className="browser-check-content">
        {!support.bluetooth && (
          <div>
            <strong>⚠️ Web Bluetooth Not Supported</strong>
            <p>
              Your browser doesn't support Web Bluetooth. Please use Chrome, Edge, or Opera.
              {support.browserName && ` (Current: ${support.browserName})`}
            </p>
          </div>
        )}
        {support.bluetooth && !support.https && (
          <div>
            <strong>⚠️ HTTPS Required</strong>
            <p>
              Web Bluetooth requires HTTPS. Please access this app via https:// or localhost.
            </p>
          </div>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="browser-check-dismiss">
        Dismiss
      </button>
    </div>
  );
}
