
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { OrderProvider } from './contexts/OrderContext.tsx'
import { Toaster } from './components/ui/sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <OrderProvider>
        <App />
        <Toaster />
      </OrderProvider>
    </AuthProvider>
  </React.StrictMode>,
)
