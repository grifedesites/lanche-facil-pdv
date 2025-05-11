import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface CashFlow {
  id: string;
  type: "open" | "close" | "input" | "output";
  amount: number;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface CashierState {
  isOpen: boolean;
  balance: number;
  openedBy: string | null;
  openedAt: string | null;
  initialAmount: number;
}

export interface CashierOperation {
  id: string;
  type: "opening" | "closing" | "inflow" | "outflow" | "sale";
  amount: number;
  description: string;
  timestamp: string;
  category?: string;
}

export interface CurrentCashier {
  openedAt: string;
  currentBalance: number;
}

export interface PaymentReconciliation {
  method: string;
  amount: number;
}

interface CashierContextType {
  cashState: CashierState;
  cashFlows: CashFlow[];
  cashierOperations: CashierOperation[];
  currentCashier: CurrentCashier | null;
  cashierOpen: boolean;
  openCashier: (userId: string, userName: string, initialAmount: number) => void;
  closeCashier: (userId: string, userName: string, reconciliation?: PaymentReconciliation[], password?: string) => Promise<boolean>;
  addCashInput: (userId: string, userName: string, amount: number, description: string) => void;
  addCashOutput: (userId: string, userName: string, amount: number, description: string) => void;
  getCashFlowsByDate: (startDate: Date, endDate: Date) => CashFlow[];
  getCurrentBalance: () => number;
  registerCashierInflow: (amount: number, description: string, category?: string) => void;
  registerCashierOutflow: (amount: number, description: string, category?: string) => void;
}

// Initial state
const initialCashierState: CashierState = {
  isOpen: false,
  balance: 0,
  openedBy: null,
  openedAt: null,
  initialAmount: 0
};

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cashState, setCashState] = useState<CashierState>(initialCashierState);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [cashierOperations, setCashierOperations] = useState<CashierOperation[]>([]);

  // Check if the cashier is open
  const cashierOpen = cashState.isOpen;
  
  // Current cashier information
  const currentCashier = cashierOpen ? {
    openedAt: cashState.openedAt || new Date().toISOString(),
    currentBalance: cashState.balance
  } : null;

  // Open cashier
  const openCashier = (userId: string, userName: string, initialAmount: number) => {
    if (cashState.isOpen) {
      toast.error("O caixa já está aberto!");
      return;
    }

    const newFlow: CashFlow = {
      id: uuidv4(),
      type: "open",
      amount: initialAmount,
      description: "Abertura de caixa",
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };

    const newOperation: CashierOperation = {
      id: uuidv4(),
      type: "opening",
      amount: initialAmount,
      description: "Abertura de caixa",
      timestamp: new Date().toISOString(),
    };

    setCashState({
      isOpen: true,
      balance: initialAmount,
      openedBy: userName,
      openedAt: new Date().toISOString(),
      initialAmount
    });

    setCashFlows([...cashFlows, newFlow]);
    setCashierOperations([...cashierOperations, newOperation]);
    
    // Save to Supabase
    saveCashierToSupabase(userId, userName, initialAmount);
    
    toast.success("Caixa aberto com sucesso!");
  };

  // Save cashier to Supabase
  const saveCashierToSupabase = async (userId: string, userName: string, initialAmount: number) => {
    try {
      const { error } = await supabase.from('cashiers').insert({
        opened_by: userId,
        opened_by_name: userName,
        initial_balance: initialAmount,
        current_balance: initialAmount,
        is_open: true
      });
      
      if (error) throw error;
      
      // Save the operation
      await supabase.from('cashier_operations').insert({
        user_id: userId,
        username: userName,
        type: 'opening',
        amount: initialAmount,
        description: 'Abertura de caixa'
      });
      
    } catch (error) {
      console.error('Error saving cashier to Supabase:', error);
    }
  };

  // Close cashier
  const closeCashier = async (userId: string, userName: string, reconciliation?: PaymentReconciliation[], password?: string): Promise<boolean> => {
    if (!cashState.isOpen) {
      toast.error("O caixa já está fechado!");
      return false;
    }

    // Verify closing password if provided
    if (password) {
      // Check admin closing password in Supabase settings table
      try {
        const { data: settings, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'admin_closing_password')
          .single();
        
        if (error) throw error;
        
        // If password doesn't match, block closing
        if (!settings || settings.value !== password) {
          toast.error("Senha de fechamento incorreta!");
          return false;
        }
      } catch (error) {
        console.error('Error validating closing password:', error);
        toast.error("Erro ao validar senha de fechamento");
        return false;
      }
    }

    const newFlow: CashFlow = {
      id: uuidv4(),
      type: "close",
      amount: cashState.balance,
      description: "Fechamento de caixa",
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };

    const newOperation: CashierOperation = {
      id: uuidv4(),
      type: "closing",
      amount: cashState.balance,
      description: "Fechamento de caixa",
      timestamp: new Date().toISOString(),
    };

    setCashFlows([...cashFlows, newFlow]);
    setCashierOperations([...cashierOperations, newOperation]);
    
    // Save to Supabase
    try {
      await closeCashierInSupabase(userId, userName, cashState.balance, reconciliation);
      
      setCashState(initialCashierState);
      toast.success("Caixa fechado com sucesso!");
      return true;
    } catch (error) {
      console.error('Error closing cashier:', error);
      toast.error("Erro ao fechar o caixa");
      return false;
    }
  };

  // Close cashier in Supabase
  const closeCashierInSupabase = async (userId: string, userName: string, closingBalance: number, reconciliation?: PaymentReconciliation[]) => {
    try {
      // Get the open cashier
      const { data: openCashiers, error: fetchError } = await supabase
        .from('cashiers')
        .select('id')
        .eq('is_open', true)
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (openCashiers && openCashiers.length > 0) {
        const cashierId = openCashiers[0].id;
        
        // Update the cashier
        const { error } = await supabase
          .from('cashiers')
          .update({
            closed_by: userId,
            closed_by_name: userName,
            closing_balance: closingBalance,
            is_open: false,
            closed_at: new Date().toISOString()
          })
          .eq('id', cashierId);
        
        if (error) throw error;
        
        // Save the operation
        await supabase.from('cashier_operations').insert({
          user_id: userId,
          username: userName,
          type: 'closing',
          amount: closingBalance,
          description: 'Fechamento de caixa'
        });
        
        // If reconciliation data is provided, save it
        if (reconciliation && reconciliation.length > 0) {
          for (const payment of reconciliation) {
            await supabase.from('cashier_reconciliation').insert({
              cashier_id: cashierId,
              payment_method: payment.method,
              reported_amount: payment.amount,
              user_id: userId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error closing cashier in Supabase:', error);
      throw error;
    }
  };

  // Add cash input
  const addCashInput = (userId: string, userName: string, amount: number, description: string) => {
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para registrar entradas!");
      return;
    }

    const newFlow: CashFlow = {
      id: uuidv4(),
      type: "input",
      amount,
      description,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };

    setCashState({
      ...cashState,
      balance: cashState.balance + amount
    });

    setCashFlows([...cashFlows, newFlow]);
    
    // Save to Supabase
    saveCashierOperation(userId, userName, 'inflow', amount, description);
    
    toast.success("Entrada de caixa registrada com sucesso!");
  };

  // Add cash output
  const addCashOutput = (userId: string, userName: string, amount: number, description: string) => {
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para registrar saídas!");
      return;
    }

    if (cashState.balance < amount) {
      toast.error("Saldo insuficiente para esta operação!");
      return;
    }

    const newFlow: CashFlow = {
      id: uuidv4(),
      type: "output",
      amount,
      description,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };

    setCashState({
      ...cashState,
      balance: cashState.balance - amount
    });

    setCashFlows([...cashFlows, newFlow]);
    
    // Save to Supabase
    saveCashierOperation(userId, userName, 'outflow', amount, description);
    
    toast.success("Sangria de caixa registrada com sucesso!");
  };

  // Register cashier inflow (for CashierManagement page)
  const registerCashierInflow = (amount: number, description: string, category: string = "general") => {
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para registrar entradas!");
      return;
    }

    const newOperation: CashierOperation = {
      id: uuidv4(),
      type: "inflow",
      amount,
      description,
      category,
      timestamp: new Date().toISOString(),
    };

    setCashState({
      ...cashState,
      balance: cashState.balance + amount
    });

    setCashierOperations([...cashierOperations, newOperation]);
    
    // Update cashier balance in Supabase
    updateCashierBalanceInSupabase(cashState.balance + amount);
    
    toast.success("Entrada registrada com sucesso!");
  };

  // Register cashier outflow (for CashierManagement page)
  const registerCashierOutflow = (amount: number, description: string, category: string = "general") => {
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para registrar saídas!");
      return;
    }

    if (cashState.balance < amount) {
      toast.error("Saldo insuficiente para esta operação!");
      return;
    }

    const newOperation: CashierOperation = {
      id: uuidv4(),
      type: "outflow",
      amount,
      description,
      category,
      timestamp: new Date().toISOString(),
    };

    setCashState({
      ...cashState,
      balance: cashState.balance - amount
    });

    setCashierOperations([...cashierOperations, newOperation]);
    
    // Update cashier balance in Supabase
    updateCashierBalanceInSupabase(cashState.balance - amount);
    
    toast.success("Saída registrada com sucesso!");
  };
  
  // Helper function to save cashier operations to Supabase
  const saveCashierOperation = async (userId: string, userName: string, type: string, amount: number, description: string, category?: string) => {
    try {
      const { error } = await supabase.from('cashier_operations').insert({
        user_id: userId,
        username: userName,
        type,
        amount,
        description,
        category
      });
      
      if (error) throw error;
      
      // Update the current cashier balance
      updateCashierBalanceInSupabase(
        type === 'inflow' || type === 'sale' ? cashState.balance + amount : cashState.balance - amount
      );
      
    } catch (error) {
      console.error('Error saving cashier operation to Supabase:', error);
    }
  };
  
  // Update cashier balance in Supabase
  const updateCashierBalanceInSupabase = async (newBalance: number) => {
    try {
      const { data: openCashiers, error: fetchError } = await supabase
        .from('cashiers')
        .select('id')
        .eq('is_open', true)
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (openCashiers && openCashiers.length > 0) {
        const cashierId = openCashiers[0].id;
        
        const { error } = await supabase
          .from('cashiers')
          .update({ current_balance: newBalance })
          .eq('id', cashierId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating cashier balance:', error);
    }
  };

  // Get flows by date
  const getCashFlowsByDate = (startDate: Date, endDate: Date) => {
    return cashFlows.filter(flow => {
      const flowDate = new Date(flow.timestamp);
      return flowDate >= startDate && flowDate <= endDate;
    });
  };

  // Get current balance
  const getCurrentBalance = () => {
    return cashState.balance;
  };

  const value = {
    cashState,
    cashFlows,
    cashierOperations,
    currentCashier,
    cashierOpen,
    openCashier,
    closeCashier,
    addCashInput,
    addCashOutput,
    getCashFlowsByDate,
    getCurrentBalance,
    registerCashierInflow,
    registerCashierOutflow
  };

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
};

export const useCashier = (): CashierContextType => {
  const context = useContext(CashierContext);
  if (context === undefined) {
    throw new Error("useCashier deve ser usado dentro de um CashierProvider");
  }
  return context;
};
