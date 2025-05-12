
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Componente que mostra o status da conexão com o servidor Supabase
 */
export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const { refreshSession } = useAuth();

  // Verificar conexão com o servidor
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Teste de conexão com o Supabase
        const { error } = await supabase.from('settings').select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          console.log('Erro de conexão com o servidor:', error);
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Falha ao verificar conexão:', error);
        setIsConnected(false);
      }
    };

    // Verificar conexão imediatamente e a cada 30 segundos
    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshConnection = async () => {
    try {
      await refreshSession();
      
      // Verificar novamente a conexão
      const { error } = await supabase.from('settings').select('count(*)', { count: 'exact', head: true });
      
      if (!error) {
        setIsConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Falha ao reconectar:', error);
      return false;
    }
  };

  if (isConnected) return null;

  return (
    <button 
      onClick={handleRefreshConnection}
      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-full border border-amber-200 transition-colors"
      title="Clique para tentar reconectar"
    >
      <WifiOff size={12} />
      <span>Offline</span>
    </button>
  );
};
