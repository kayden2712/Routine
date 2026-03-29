import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppToaster } from '@/components/shared/Toast';
import './index.css';
import { router } from './app/router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
    <AppToaster />
  </StrictMode>,
);
 