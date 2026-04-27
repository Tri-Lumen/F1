import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: 100%; }
  body {
    background: #101010;
    color: #f0f0f0;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100%;
  }
  body::before {
    content: '';
    pointer-events: none;
    position: fixed; inset: 0; z-index: 0;
    background:
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
      radial-gradient(ellipse 80% 42% at 50% -4%, rgba(225,6,0,0.13) 0%, rgba(225,6,0,0.05) 40%, transparent 72%);
  }
  #root { position: relative; z-index: 1; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #181818; }
  ::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 2px; }
  @keyframes pulseLive {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(225,6,0,0.6); }
    50%       { opacity: 0.55; box-shadow: 0 0 0 5px rgba(225,6,0,0); }
  }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes slideR  { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:none; } }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
