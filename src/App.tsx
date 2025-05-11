
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import CashierManagement from './pages/CashierManagement';
import { ThemeProvider } from './contexts/ThemeContext';
import CashierReports from "./pages/CashierReports";
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import NotFound from './pages/NotFound';

function App() {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const storedIsAdmin = localStorage.getItem('isAdmin');
      setIsAdmin(storedIsAdmin === 'true' || (user && user.isAdmin) || false);
    };

    checkAdminStatus();
  }, [isAuthenticated, user]);

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
          <Route path="/" element={<PrivateRoute>{isAdmin ? <Dashboard /> : <POS />}</PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/kitchen" element={<PrivateRoute><Kitchen /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/cashier-management" element={<AdminRoute><CashierManagement /></AdminRoute>} />
          <Route path="/cashier-reports" element={<AdminRoute><CashierReports /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
