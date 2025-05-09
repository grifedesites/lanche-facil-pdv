
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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

interface CashierContextType {
  cashState: CashierState;
  cashFlows: CashFlow[];
  cashierOperations: CashierOperation[];
  currentCashier: CurrentCashier | null;
  cashierOpen: boolean;
  openCashier: (userId: string, userName: string, initialAmount: number) => void;
  closeCashier: (userId: string, userName: string) => void;
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
    toast.success("Caixa aberto com sucesso!");
  };

  // Close cashier
  const closeCashier = (userId: string, userName: string) => {
    if (!cashState.isOpen) {
      toast.error("O caixa já está fechado!");
      return;
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
    setCashState(initialCashierState);
    toast.success("Caixa fechado com sucesso!");
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
    toast.success("Saída registrada com sucesso!");
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
