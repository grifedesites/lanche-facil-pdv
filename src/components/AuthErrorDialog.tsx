
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AuthErrorDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message?: string;
}

export const AuthErrorDialog: React.FC<AuthErrorDialogProps> = ({ 
  open, 
  setOpen, 
  message = "Houve um problema com sua sessão de autenticação." 
}) => {
  const navigate = useNavigate();
  const { refreshSession, logout } = useAuth();

  const handleRetry = async () => {
    try {
      await refreshSession();
      setOpen(false);
    } catch (error) {
      console.error("Falha ao renovar sessão:", error);
      // Manter o diálogo aberto se falhar
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Problema de Autenticação
          </AlertDialogTitle>
          <AlertDialogDescription>
            {message}
            <div className="mt-2 text-sm text-gray-600">
              Você pode tentar reconectar ou continuar trabalhando no modo local com funcionalidade limitada.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar Offline</AlertDialogCancel>
          <AlertDialogAction onClick={handleRetry}>
            Tentar Reconectar
          </AlertDialogAction>
          <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
            Fazer Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
