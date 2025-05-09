import React, { createContext, useContext, useState } from "react";
import { Product, useProducts } from "./ProductContext";
import { useCashier } from "./CashierContext";
import { toast } from "sonner";

// Tipos
export interface OrderFormItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type OrderStatus = "pending" | "preparing" | "completed" | "cancelled";

export interface Order {
  id: string;
  items: OrderFormItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  completedAt?: string;
  userId: string;
  userName: string;
  paymentMethod?: string;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: OrderFormItem[];
  addItem: (product: Product, quantity: number, notes?: string) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  completeOrder: (userId: string, userName: string, paymentMethod: string) => boolean;
  cancelOrder: (orderId: string) => void;
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (filteredOrders?: Order[]) => number;
  getOrdersByDate: (date: Date) => Order[];
  markOrderAsReady: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

// Mock de pedidos iniciais para exemplificar
const INITIAL_ORDERS: Order[] = [
  {
    id: "1",
    items: [
      { productId: "1", productName: "X-Burger", quantity: 2, unitPrice: 15.90 },
      { productId: "3", productName: "Refrigerante Lata", quantity: 2, unitPrice: 5.00 }
    ],
    status: "completed",
    total: 41.80,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Ontem
    completedAt: new Date(Date.now() - 86300000).toISOString(),
    userId: "1",
    userName: "Admin",
    paymentMethod: "dinheiro"
  },
  {
    id: "2",
    items: [
      { productId: "2", productName: "X-Salada", quantity: 1, unitPrice: 17.90 },
      { productId: "4", productName: "Batata Frita P", quantity: 1, unitPrice: 8.90 }
    ],
    status: "completed",
    total: 26.80,
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 horas atrás
    completedAt: new Date(Date.now() - 43100000).toISOString(),
    userId: "1",
    userName: "Admin",
    paymentMethod: "cartao_credito"
  },
  // Adicionando um pedido em preparo para exemplo
  {
    id: "3",
    items: [
      { productId: "1", productName: "X-Burger", quantity: 1, unitPrice: 15.90 },
      { productId: "4", productName: "Batata Frita P", quantity: 1, unitPrice: 8.90 }
    ],
    status: "preparing",
    total: 24.80,
    createdAt: new Date().toISOString(),
    userId: "1",
    userName: "Admin",
    paymentMethod: "dinheiro"
  }
];

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [currentOrder, setCurrentOrder] = useState<OrderFormItem[]>([]);
  const { updateStock } = useProducts();
  const { cashState, addCashInput } = useCashier();

  const addItem = (product: Product, quantity: number, notes?: string) => {
    const existingItemIndex = currentOrder.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      // Se o produto já existe, apenas incrementa a quantidade
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += quantity;
      setCurrentOrder(updatedOrder);
    } else {
      // Se não existe, adiciona como novo item
      const newItem: OrderFormItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        notes
      };
      setCurrentOrder([...currentOrder, newItem]);
    }
  };

  const updateItem = (index: number, quantity: number, notes?: string) => {
    if (index < 0 || index >= currentOrder.length) return;

    const updatedOrder = [...currentOrder];
    updatedOrder[index] = {
      ...updatedOrder[index],
      quantity,
      notes
    };
    setCurrentOrder(updatedOrder);
  };

  const removeItem = (index: number) => {
    if (index < 0 || index >= currentOrder.length) return;
    
    const updatedOrder = [...currentOrder];
    updatedOrder.splice(index, 1);
    setCurrentOrder(updatedOrder);
  };

  const clearOrder = () => {
    setCurrentOrder([]);
  };

  const completeOrder = (userId: string, userName: string, paymentMethod: string): boolean => {
    // Verifica se o caixa está aberto
    if (!cashState.isOpen) {
      toast.error("O caixa precisa estar aberto para finalizar pedidos!");
      return false;
    }

    // Calcula o total do pedido
    const total = currentOrder.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Atualiza o estoque para cada item
    let canCompleteOrder = true;
    currentOrder.forEach(item => {
      // Verifica se há estoque suficiente - este é apenas um check,
      // a função updateStock já impede atualização se ficar negativo
      try {
        updateStock(item.productId, -item.quantity);
      } catch (error) {
        canCompleteOrder = false;
        toast.error(`Estoque insuficiente para ${item.productName}`);
      }
    });

    if (!canCompleteOrder) {
      return false;
    }

    // Cria o novo pedido - agora com status 'preparing' para a cozinha
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      items: [...currentOrder],
      status: "preparing", // Alterado de 'completed' para 'preparing'
      total,
      createdAt: new Date().toISOString(),
      userId,
      userName,
      paymentMethod
    };

    // Adiciona o pedido à lista
    setOrders([...orders, newOrder]);

    // Registra a entrada no caixa
    addCashInput(
      userId,
      userName,
      total,
      `Pedido #${newOrder.id} - ${paymentMethod}`
    );

    // Notifica a cozinha de um novo pedido
    toast.info("Novo pedido enviado para a cozinha!");
    
    // Limpa o pedido atual
    clearOrder();

    return true;
  };

  const cancelOrder = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      )
    );
  };

  // Nova função para marcar um pedido como pronto
  const markOrderAsReady = (orderId: string) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId && order.status === "preparing") {
          toast.success(`Pedido #${orderId} está pronto!`);
          return { 
            ...order, 
            status: "completed", 
            completedAt: new Date().toISOString() 
          };
        }
        return order;
      })
    );
  };

  // Função genérica para atualizar o status de um pedido
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status };
          
          // Se o pedido estiver completo, adiciona a data de conclusão
          if (status === "completed" && !updatedOrder.completedAt) {
            updatedOrder.completedAt = new Date().toISOString();
          }
          
          return updatedOrder;
        }
        return order;
      })
    );

    // Notifica sobre a atualização de status
    toast.info(`Status do pedido #${orderId} atualizado para ${status}`);
  };

  // Implement the missing getOrdersByDate function
  const getOrdersByDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  };

  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const getOrdersTotal = (filteredOrders?: Order[]) => {
    const ordersToCalculate = filteredOrders || orders;
    return ordersToCalculate
      .filter(order => order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0);
  };

  const value = {
    orders,
    currentOrder,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
    cancelOrder,
    getOrdersByDateRange,
    getOrdersTotal,
    getOrdersByDate,
    markOrderAsReady,
    updateOrderStatus
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
