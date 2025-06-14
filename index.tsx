import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Changed from '@/App'
import { ConfirmProvider } from './components/shared/ConfirmContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </React.StrictMode>
);