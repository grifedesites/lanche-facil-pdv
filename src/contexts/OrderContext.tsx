
// Importações necessárias
import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './ProductContext';
import { toast } from 'sonner';

// Definição de tipos
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderFormItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderFormItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  paymentMethod: string;
  completedAt?: Date;
}

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
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderFormItem[]>([]);

  const addItem = (product: Product, quantity: number) => {
    const newItem: OrderFormItem = {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price
    };

    setCurrentOrder([...currentOrder, newItem]);
    toast.success(`${product.name} adicionado ao pedido`);
  };

  const updateItem = (index: number, quantity: number, notes?: string) => {
    const updatedOrder = [...currentOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      quantity: quantity,
      notes: notes
    };
    setCurrentOrder(updatedOrder);
  };

  const removeItem = (index: number) => {
    const updatedOrder = currentOrder.filter((_, i) => i !== index);
    setCurrentOrder(updatedOrder);
    toast.info("Item removido do pedido");
  };

  const clearOrder = () => {
    setCurrentOrder([]);
    toast.info("Pedido limpo");
  };

  const completeOrder = (userId: string, userName: string, paymentMethod: string): boolean => {
    if (currentOrder.length === 0) {
      toast.error("Não é possível completar um pedido vazio");
      return false;
    }

    const total = currentOrder.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newOrder: Order = {
      id: uuidv4(),
      items: [...currentOrder],
      status: 'pending',
      total: total,
      createdAt: new Date(),
      createdBy: userId,
      createdByName: userName,
      paymentMethod: paymentMethod
    };

    setOrders([...orders, newOrder]);
    setCurrentOrder([]);
    return true;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(
      orders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status };
          
          // Se o status for 'completed', registrar o horário de conclusão
          if (status === 'completed') {
            updatedOrder.completedAt = new Date();
          }
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  const getFilteredOrders = (status?: OrderStatus) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        addItem,
        updateItem,
        removeItem,
        clearOrder,
        completeOrder,
        updateOrderStatus,
        getFilteredOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider');
  }
  return context;
};
