import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useCashier } from "@/contexts/CashierContext";
import { useProducts } from "@/contexts/ProductContext";
import { supabase } from "@/integrations/supabase/client";

// Types
export type OrderStatus = "pending" | "processing" | "completed" | "canceled";

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
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  paymentMethod?: string;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: OrderFormItem[];
  addItem: (product: { id: string; name: string; price: number }, quantity: number) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  completeOrder: (userId: string, userName: string, paymentMethod: string) => boolean;
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (filteredOrders?: Order[]) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderFormItem[]>([]);
  const { cashierOpen, registerCashierInflow } = useCashier();
  const { updateStock } = useProducts();

  // Add item to the current order
  const addItem = (product: { id: string; name: string; price: number }, quantity: number) => {
    const existingItemIndex = currentOrder.findIndex((item) => item.productId === product.id);

    if (existingItemIndex !== -1) {
      // If item already exists, update its quantity
      const updatedItems = [...currentOrder];
      updatedItems[existingItemIndex].quantity += quantity;
      setCurrentOrder(updatedItems);
    } else {
      // Otherwise, add a new item
      const newItem: OrderFormItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
      };
      setCurrentOrder([...currentOrder, newItem]);
    }
  };

  // Update item in the current order
  const updateItem = (index: number, quantity: number, notes?: string) => {
    if (index < 0 || index >= currentOrder.length) return;

    const updatedItems = [...currentOrder];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      notes
    };
    setCurrentOrder(updatedItems);
  };

  // Remove item from the current order
  const removeItem = (index: number) => {
    if (index < 0 || index >= currentOrder.length) return;
    
    const updatedItems = currentOrder.filter((_, idx) => idx !== index);
    setCurrentOrder(updatedItems);
  };

  // Clear the current order
  const clearOrder = () => {
    setCurrentOrder([]);
  };

  // Complete the current order
  const completeOrder = (userId: string, userName: string, paymentMethod: string): boolean => {
    if (!cashierOpen) {
      toast.error("O caixa precisa estar aberto para finalizar pedidos!");
      return false;
    }

    if (currentOrder.length === 0) {
      toast.error("Adicione produtos ao pedido antes de finalizar!");
      return false;
    }

    const orderTotal = currentOrder.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newOrder: Order = {
      id: uuidv4(),
      items: [...currentOrder],
      total: orderTotal,
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
      userName,
      paymentMethod
    };

    setOrders([...orders, newOrder]);
    
    // Register the sale in the cashier
    registerCashierInflow(orderTotal, `Venda #${newOrder.id.slice(0, 8)}`, "sale");
    
    // Update stock for each product
    currentOrder.forEach(item => {
      updateStock(item.productId, -item.quantity);
    });
    
    // Save to Supabase
    saveOrderToSupabase(newOrder);
    
    // Clear the current order
    clearOrder();
    
    return true;
  };
  
  // Helper function to save order to Supabase
  const saveOrderToSupabase = async (order: Order) => {
    try {
      // Convert the order to Supabase format
      const orderData = {
        id: order.id,
        items: order.items,
        total: order.total,
        status: order.status,
        user_id: order.userId,
        user_name: order.userName,
        payment_method: order.paymentMethod,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      };
      
      const { error } = await supabase.from('orders').insert(orderData);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error saving order to Supabase:', error);
      toast.error("Erro ao salvar pedido no banco de dados");
    }
  };

  // Get orders within a date range
  const getOrdersByDateRange = (startDate: Date, endDate: Date): Order[] => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Calculate total sales from orders
  const getOrdersTotal = (filteredOrders?: Order[]): number => {
    const ordersToCalculate = filteredOrders || orders;
    return ordersToCalculate
      .filter(order => order.status === "completed")
      .reduce((total, order) => total + order.total, 0);
  };

  const value = {
    orders,
    currentOrder,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
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
