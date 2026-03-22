import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ContactModalProvider } from './context/ContactModalContext';
import './styles-import.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContactModalProvider>
        <App />
      </ContactModalProvider>
    </BrowserRouter>
  </React.StrictMode>
);
