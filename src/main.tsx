import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent "Cannot set property fetch of #<Window> which has only a getter" error in sandboxed iframe environments
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

    // Patch on window instance
    try {
      Object.defineProperty(win, 'fetch', fetchDescriptor);
    } catch (e) {
      // ignore
    }

    // Patch on Window prototype
    if (win.Window && win.Window.prototype) {
      try {
        Object.defineProperty(win.Window.prototype, 'fetch', fetchDescriptor);
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // Ignore property definition errors gracefully
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

