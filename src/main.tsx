import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppRoutes } from './app/router';

// Dynamic <title> per route is handled by pages themselves (Calculator sets a neutral title).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
);
