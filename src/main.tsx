import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(function fixFetchGetter() {
  try {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;

    let currentFetch = win.fetch;
    const fetchDescriptor = {
      get() {
        return currentFetch;
      },
      set(v: any) {
        currentFetch = v;
      },
      configurable: true,
      enumerable: true,
    };

    try {
      Object.defineProperty(win, 'fetch', fetchDescriptor);
    } catch (e) {
    }

    if (win.Window && win.Window.prototype) {
      try {
        Object.defineProperty(win.Window.prototype, 'fetch', fetchDescriptor);
      } catch (e) {
      }
    }
  } catch (err) {
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

