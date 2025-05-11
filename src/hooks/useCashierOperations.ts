
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CashierState, CashierHistoryRecord, CashierActionType } from '../types/cashier.types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const useCashierOperations = () => {
  const { user } = useAuth();

  const [cashState, setCashState] = useState<CashierState>({
    isOpen: false,
    currentAmount: 0,
    openedAt: null,
    openedBy: null,
    openedByName: null
  });

  const [cashHistoryRecords, setCashHistoryRecords] = useState<CashierHistoryRecord[]>([]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const storedState = localStorage.getItem('cashier-state');
      const storedHistory = localStorage.getItem('cashier-history');

      if (storedState) {
        const parsedState = JSON.parse(storedState);
        // Converter strings de data para objetos Date
        if (parsedState.openedAt) {
          parsedState.openedAt = new Date(parsedState.openedAt);
        }
        setCashState(parsedState);
      }

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // Converter strings de data para objetos Date
        const historyWithDates = parsedHistory.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
        setCashHistoryRecords(historyWithDates);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do caixa:", error);
      toast.error("Erro ao carregar dados do caixa");
    }
  }, []);

  // Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem('cashier-state', JSON.stringify(cashState));
  }, [cashState]);

  useEffect(() => {
    localStorage.setItem('cashier-history', JSON.stringify(cashHistoryRecords));
  }, [cashHistoryRecords]);

  const createHistoryRecord = (
    action: CashierActionType,
    amount: number,
    notes?: string
  ): CashierHistoryRecord => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    return {
      id: uuidv4(),
      action,
      amount,
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      notes
    };
  };

  const openCashier = (initialAmount: number, notes?: string) => {
    if (!user) {
      toast.error("Você precisa estar autenticado para abrir o caixa");
      return;
    }

    if (cashState.isOpen) {
      toast.error("O caixa já está aberto");
      return;
    }

    const newRecord = createHistoryRecord('open', initialAmount, notes);
    setCashHistoryRecords([...cashHistoryRecords, newRecord]);

    setCashState({
      isOpen: true,
      currentAmount: initialAmount,
      openedAt: new Date(),
      openedBy: user.id,
      openedByName: user.name
    });

    toast.success("Caixa aberto com sucesso!");
  };

  const closeCashier = (finalAmount: number, notes?: string) => {
    if (!user) {
      toast.error("Você precisa estar autenticado para fechar o caixa");
      return;
    }

    if (!cashState.isOpen) {
      toast.error("O caixa não está aberto");
      return;
    }

    const newRecord = createHistoryRecord('close', finalAmount, notes);
    setCashHistoryRecords([...cashHistoryRecords, newRecord]);

    setCashState({
      isOpen: false,
      currentAmount: 0,
      openedAt: null,
      openedBy: null,
      openedByName: null
    });

    toast.success("Caixa fechado com sucesso!");
  };

  const addCash = (amount: number, notes?: string) => {
    if (!user) {
      toast.error("Você precisa estar autenticado para adicionar dinheiro ao caixa");
      return;
    }

    if (!cashState.isOpen) {
      toast.error("O caixa não está aberto");
      return;
    }

    const newRecord = createHistoryRecord('add', amount, notes);
    setCashHistoryRecords([...cashHistoryRecords, newRecord]);

    setCashState({
      ...cashState,
      currentAmount: cashState.currentAmount + amount
    });

    toast.success(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} adicionado ao caixa`);
  };

  const removeCash = (amount: number, notes?: string) => {
    if (!user) {
      toast.error("Você precisa estar autenticado para retirar dinheiro do caixa");
      return;
    }

    if (!cashState.isOpen) {
      toast.error("O caixa não está aberto");
      return;
    }

    if (amount > cashState.currentAmount) {
      toast.error("Valor de retirada não pode ser maior que o valor atual do caixa");
      return;
    }

    const newRecord = createHistoryRecord('remove', amount, notes);
    setCashHistoryRecords([...cashHistoryRecords, newRecord]);

    setCashState({
      ...cashState,
      currentAmount: cashState.currentAmount - amount
    });

    toast.success(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} retirado do caixa`);
  };

  const getCashierHistory = (date?: Date) => {
    if (!date) return cashHistoryRecords;

    return cashHistoryRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return (
        recordDate.getDate() === date.getDate() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return {
    cashState,
    cashHistoryRecords,
    openCashier,
    closeCashier,
    addCash,
    removeCash,
    getCashierHistory
  };
};
