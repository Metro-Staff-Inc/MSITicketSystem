import 'bootstrap/dist/css/bootstrap.min.css'; // ✅ Bootstrap styles
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // optional, for your own extra styles
import { TicketProvider } from './TicketContext'; // ✅ Add this line

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TicketProvider> {/* ✅ Wrap App inside this */}
        <App />
      </TicketProvider>
    </BrowserRouter>
  </React.StrictMode>
);
