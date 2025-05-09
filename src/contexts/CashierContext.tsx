
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

// Tipos
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

interface CashierContextType {
  cashState: CashierState;
  cashFlows: CashFlow[];
  openCashier: (userId: string, userName: string, initialAmount: number) => void;
  closeCashier: (userId: string, userName: string) => void;
  addCashInput: (userId: string, userName: string, amount: number, description: string) => void;
  addCashOutput: (userId: string, userName: string, amount: number, description: string) => void;
  getCashFlowsByDate: (startDate: Date, endDate: Date) => CashFlow[];
  getCurrentBalance: () => number;
}

// Estado inicial
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

  // Abrir caixa
  const openCashier = (userId: string, userName: string, initialAmount: number) => {
    if (cashState.isOpen) {
      toast.error("O caixa já está aberto!");
      return;
    }

    const newFlow: CashFlow = {
      id: `cash-${Date.now()}`,
      type: "open",
      amount: initialAmount,
      description: "Abertura de caixa",
      userId,
      userName,
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
    toast.success("Caixa aberto com sucesso!");
  };

  // Fechar caixa
  const closeCashier = (userId: string, userName: string) => {
    if (!cashState.isOpen) {
      toast.error("O caixa já está fechado!");
      return;
    }

    const newFlow: CashFlow = {
      id: `cash-${Date.now()}`,
      type: "close",
      amount: cashState.balance,
      description: "Fechamento de caixa",
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };

    setCashFlows([...cashFlows, newFlow]);
    setCashState(initialCashierState);
    toast.success("Caixa fechado com sucesso!");
  };

  // Adicionar entrada no caixa (suprimento)
  const addCashInput = (userId: string, userName: string, amount: number, description: string) => {
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para registrar entradas!");
      return;
    }

    const newFlow: CashFlow = {
      id: `cash-${Date.now()}`,
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

  // Adicionar saída no caixa (sangria)
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
      id: `cash-${Date.now()}`,
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

  // Obter movimentações por período
  const getCashFlowsByDate = (startDate: Date, endDate: Date) => {
    return cashFlows.filter(flow => {
      const flowDate = new Date(flow.timestamp);
      return flowDate >= startDate && flowDate <= endDate;
    });
  };

  // Obter saldo atual
  const getCurrentBalance = () => {
    return cashState.balance;
  };

  const value = {
    cashState,
    cashFlows,
    openCashier,
    closeCashier,
    addCashInput,
    addCashOutput,
    getCashFlowsByDate,
    getCurrentBalance
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
