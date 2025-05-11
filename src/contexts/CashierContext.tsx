
import React, { createContext, useContext } from 'react';
import { CashierContextType } from '../types/cashier.types';
import { useCashierOperations } from '../hooks/useCashierOperations';

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cashierOperations = useCashierOperations();

  return (
    <CashierContext.Provider value={cashierOperations}>
      {children}
    </CashierContext.Provider>
  );
};

export const useCashier = (): CashierContextType => {
  const context = useContext(CashierContext);
  if (context === undefined) {
    throw new Error('useCashier deve ser usado dentro de um CashierProvider');
  }
  return context;
};

export type { CashierContextType, CashierState, CashierHistoryRecord, CashierActionType } from '../types/cashier.types';
