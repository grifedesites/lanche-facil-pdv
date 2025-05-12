
import React from 'react';
import { useCashier } from '@/contexts/CashierContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export const CashierStatusWidget: React.FC = () => {
  const { cashierOpen, currentCashier } = useCashier();
  const { lastAuthError } = useAuth();

  return (
    <div className="flex items-center space-x-2">
      {cashierOpen && (
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700">
            Caixa aberto 
          </span>
        </div>
      )}
      
      {!cashierOpen && (
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-700">
            Caixa fechado
          </span>
        </div>
      )}
      
      <div className="ml-2">
        <ConnectionStatus />
      </div>
      
      {lastAuthError && (
        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          Modo local ativo
        </div>
      )}
    </div>
  );
};
