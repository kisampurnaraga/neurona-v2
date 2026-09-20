import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party injected browser extension errors (e.g. MetaMask / Web3 wallets)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.message || reason.stack || String(reason))) || '';
    if (
      msg.toLowerCase().includes('metamask') ||
      msg.toLowerCase().includes('ethereum') ||
      msg.toLowerCase().includes('chrome-extension://') ||
      msg.toLowerCase().includes('failed to connect')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = (event.message || '') + ' ' + (event.filename || '');
    if (
      msg.toLowerCase().includes('metamask') ||
      msg.toLowerCase().includes('ethereum') ||
      msg.toLowerCase().includes('chrome-extension://')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

