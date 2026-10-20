// Precisa vir antes do App: aplica as preferências trazidas do endereço antigo.
import './lib/domainMove';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { trackVisualViewport } from './lib/visualViewport';

trackVisualViewport();

// Desregistra service worker antigo para evitar cache stale
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
