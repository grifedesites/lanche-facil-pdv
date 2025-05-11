
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { OrderProvider } from './contexts/OrderContext.tsx'
import { CashierProvider } from './contexts/CashierContext.tsx'
import { Toaster } from './components/ui/sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <OrderProvider>
        <CashierProvider>
          <App />
          <Toaster />
        </CashierProvider>
      </OrderProvider>
    </AuthProvider>
  </React.StrictMode>,
)
