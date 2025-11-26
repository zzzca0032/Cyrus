import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode can double-invoke effects in dev, which is tricky for MediaPipe initialization 
  // but we have singleton checks. Keeping it for best practices.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
