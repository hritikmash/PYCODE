import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { WebSocketProvider } from './context/WebSocketContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </AuthProvider>
  </ErrorBoundary>
);
