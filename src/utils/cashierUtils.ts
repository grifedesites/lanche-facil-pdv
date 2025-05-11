
import { CashierHistoryRecord } from "../types/cashier.types";

export interface CashFlow {
  id: string;
  type: "open" | "close" | "add" | "remove";
  amount: number;
  description?: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export const mapHistoryRecordToFlow = (record: CashierHistoryRecord): CashFlow => {
  let type: "open" | "close" | "add" | "remove";
  
  switch (record.action) {
    case "open":
      type = "open";
      break;
    case "close":
      type = "close";
      break;
    case "add":
      type = "add";
      break;
    case "remove":
      type = "remove";
      break;
    default:
      type = "add";
  }
  
  return {
    id: record.id,
    type,
    amount: record.amount,
    description: record.notes,
    timestamp: record.timestamp,
    userId: record.userId,
    userName: record.userName
  };
};

export const getCashierOperations = (records: CashierHistoryRecord[]): CashFlow[] => {
  return records.map(mapHistoryRecordToFlow);
};

export const getCurrentCashier = (cashState: any) => {
  if (!cashState.isOpen) return null;
  
  return {
    openedAt: cashState.openedAt,
    openedBy: cashState.openedBy,
    openedByName: cashState.openedByName,
    currentBalance: cashState.currentAmount
  };
};
