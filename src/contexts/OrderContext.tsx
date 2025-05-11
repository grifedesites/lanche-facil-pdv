
import React, { createContext, useContext } from 'react';
import { Order, OrderFormItem, OrderStatus } from '@/types/order.types';
import { Product } from './ProductContext';
import { useOrderActions } from '@/hooks/useOrderActions';
import { getFilteredOrders, getOrdersByDateRange, getOrdersTotal } from '@/utils/orderUtils';

interface OrderContextType {
  orders: Order[];
  currentOrder: OrderFormItem[];
  addItem: (product: Product, quantity: number) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  completeOrder: (userId: string, userName: string, paymentMethod: string) => boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getFilteredOrders: (status?: OrderStatus) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (filteredOrders: Order[]) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    orders,
    currentOrder,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
    updateOrderStatus
  } = useOrderActions();

  const contextValue: OrderContextType = {
    orders,
    currentOrder,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
    updateOrderStatus,
    getFilteredOrders: (status?: OrderStatus) => getFilteredOrders(orders, status),
    getOrdersByDateRange: (startDate: Date, endDate: Date) => getOrdersByDateRange(orders, startDate, endDate),
    getOrdersTotal: (filteredOrders: Order[]) => getOrdersTotal(filteredOrders)
  };

  return <OrderContext.Provider value={contextValue}>{children}</OrderContext.Provider>;
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider');
  }
  return context;
};

export type { Order, OrderFormItem, OrderStatus };
