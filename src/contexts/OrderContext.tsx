
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { Product } from "./ProductContext";

// Tipos
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
  employeeId: string;
  employeeName: string;
  paymentMethod?: string;
}

export interface OrderFormItem extends OrderItem {
  product: Product;
}

interface OrderContextType {
  currentOrder: OrderFormItem[];
  orders: Order[];
  addItem: (product: Product, quantity: number, notes?: string) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  completeOrder: (employeeId: string, employeeName: string, paymentMethod: string) => void;
  cancelOrder: (orderId: string) => void;
  getOrdersByDate: (date: Date) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (orders: Order[]) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<OrderFormItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addItem = (product: Product, quantity: number, notes?: string) => {
    // Verificar se o produto já está no pedido
    const existingItemIndex = currentOrder.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex !== -1) {
      // Se já existe, apenas atualize a quantidade
      const updatedItems = [...currentOrder];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].notes = notes || updatedItems[existingItemIndex].notes;
      setCurrentOrder(updatedItems);
      toast.success(`${product.name} atualizado no pedido!`);
    } else {
      // Se não existe, adicione um novo item
      setCurrentOrder([
        ...currentOrder,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          notes,
          product
        }
      ]);
      toast.success(`${product.name} adicionado ao pedido!`);
    }
  };

  const updateItem = (index: number, quantity: number, notes?: string) => {
    const updatedItems = [...currentOrder];
    updatedItems[index].quantity = quantity;
    if (notes !== undefined) {
      updatedItems[index].notes = notes;
    }
    setCurrentOrder(updatedItems);
  };

  const removeItem = (index: number) => {
    const itemName = currentOrder[index].productName;
    setCurrentOrder(currentOrder.filter((_, i) => i !== index));
    toast.success(`${itemName} removido do pedido!`);
  };

  const clearOrder = () => {
    setCurrentOrder([]);
  };

  const completeOrder = (employeeId: string, employeeName: string, paymentMethod: string) => {
    if (currentOrder.length === 0) {
      toast.error("Não é possível finalizar um pedido vazio!");
      return;
    }

    const total = currentOrder.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      items: currentOrder.map(({ product, ...item }) => item),
      total,
      status: "completed",
      createdAt: new Date(),
      completedAt: new Date(),
      employeeId,
      employeeName,
      paymentMethod
    };

    setOrders([...orders, newOrder]);
    setCurrentOrder([]);
    toast.success("Pedido finalizado com sucesso!");
    
    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders(
      orders.map(order =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      )
    );
    toast.success("Pedido cancelado com sucesso!");
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getOrdersByDate = (date: Date) => {
    return orders.filter(order => isSameDay(new Date(order.createdAt), date));
  };

  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  };

  const getOrdersTotal = (ordersToSum: Order[]) => {
    return ordersToSum.reduce((sum, order) => 
      order.status === "completed" ? sum + order.total : sum, 0
    );
  };

  const value = {
    currentOrder,
    orders,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
    cancelOrder,
    getOrdersByDate,
    getOrdersByDateRange,
    getOrdersTotal
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders deve ser usado dentro de um OrderProvider");
  }
  return context;
};
