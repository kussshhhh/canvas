console.log('=== React App Starting ===');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  console.log('React:', typeof React);
  console.log('ReactDOM:', typeof ReactDOM);
  console.log('App:', typeof App);
  
  const root = document.getElementById('root');
  console.log('Root element:', root);
  
  if (!root) {
    console.error('Root element not found!');
    throw new Error('Root element not found');
  }

  console.log('Mounting React app...');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log('React app mounted successfully!');
} catch (error) {
  console.error('Error mounting React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee;">
      <h2>Error Loading App</h2>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
}
