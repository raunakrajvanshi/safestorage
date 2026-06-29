import React from 'react';
import ReactDOM from 'react-dom/client';
import { StorageProvider } from '@safestorage/react';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StorageProvider password="demo-secret-key-1234" namespace="react-demo::">
      <App />
    </StorageProvider>
  </React.StrictMode>,
);
