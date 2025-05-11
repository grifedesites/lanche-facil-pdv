
export type CashierActionType = 'open' | 'close' | 'add' | 'remove';

export interface CashierHistoryRecord {
  id: string;
  action: CashierActionType;
  amount: number;
  timestamp: Date;
  userId: string;
  userName: string;
  notes?: string;
}

export interface CashierState {
  isOpen: boolean;
  currentAmount: number;
  openedAt: Date | null;
  openedBy: string | null;
  openedByName: string | null;
}

export interface CashierContextType {
  cashState: CashierState;
  cashHistoryRecords: CashierHistoryRecord[];
  openCashier: (initialAmount: number, notes?: string) => void;
  closeCashier: (finalAmount: number, notes?: string) => void;
  addCash: (amount: number, notes?: string) => void;
  removeCash: (amount: number, notes?: string) => void;
  getCashierHistory: (date?: Date) => CashierHistoryRecord[];
}
