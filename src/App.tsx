import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import CashierManagement from './pages/CashierManagement';
import AppShell from './components/Layout/AppShell';
import Loading from './components/ui/Loading';
import { ThemeProvider } from './components/ui/theme-provider';
import CashierReports from "./pages/CashierReports";

function App() {
  const { authInitialized, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const storedIsAdmin = localStorage.getItem('isAdmin');
      setIsAdmin(storedIsAdmin === 'true');
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  if (!authInitialized) {
    return <Loading />;
  }

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/" />;
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/cashier-management" element={<AdminRoute><CashierManagement /></AdminRoute>} />
          <Route path="/cashier-reports" element={<CashierReports />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
