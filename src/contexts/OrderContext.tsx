
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isSameDay, isWithinInterval } from "date-fns";

// Define the types
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string | null;
  status: "pending" | "completed" | "cancelled" | "preparing";
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  userName: string | null;
  completedAt?: string;
}

export type OrderStatus = "pending" | "completed" | "cancelled" | "preparing";

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  addItemToOrder: (productId: string, name: string, price: number) => void;
  removeItemFromOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearOrder: () => void;
  createOrder: (paymentMethod: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getOrdersByDate: (date: Date) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (orders: Order[]) => number;
  markOrderAsReady?: (orderId: string) => Promise<void>;
  
  // Aliases para compatibilidade com o POS.tsx
  addItem: (product: any, quantity: number) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
}

// Create the context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Create the provider
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const { user } = useAuth();

  // Function to fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Map the Supabase data to the Order type
      const typedOrders: Order[] = data.map((order) => ({
        id: order.id,
        items: order.items || [],
        total: order.total,
        paymentMethod: order.payment_method,
        status: order.status as "pending" | "completed" | "cancelled" | "preparing",
        createdAt: order.created_at,
        updatedAt: order.completed_at || order.created_at,
        userId: order.user_id,
        userName: order.username,
        completedAt: order.completed_at,
      }));

      setOrders(typedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
      toast.error("Erro ao carregar pedidos.");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Helper functions for Dashboard
  const getOrdersByDate = (date: Date): Order[] => {
    return orders.filter(order => 
      isSameDay(new Date(order.createdAt), date)
    );
  };

  const getOrdersByDateRange = (startDate: Date, endDate: Date): Order[] => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });
  };

  const getOrdersTotal = (ordersToSum: Order[]): number => {
    return ordersToSum.reduce((sum, order) => 
      order.status === "completed" ? sum + order.total : sum, 0
    );
  };

  // Function to add an item to the current order
  const addItemToOrder = (productId: string, name: string, price: number) => {
    if (!currentOrder) {
      // If there's no current order, create a new one
      const newOrder: Order = {
        id: uuidv4(),
        items: [{ id: uuidv4(), productId, name, quantity: 1, price }],
        total: price,
        paymentMethod: null,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user?.id || null,
        userName: user?.name || user?.username || null,
      };
      setCurrentOrder(newOrder);
    } else {
      // If there's a current order, check if the item already exists
      const existingItem = currentOrder.items.find(
        (item) => item.productId === productId
      );
      if (existingItem) {
        // If the item exists, update the quantity
        const updatedItems = currentOrder.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        const updatedOrder = {
          ...currentOrder,
          items: updatedItems,
          total: currentOrder.total + price,
          updatedAt: new Date().toISOString(),
        };
        setCurrentOrder(updatedOrder);
      } else {
        // If the item doesn't exist, add it to the order
        const newItem: OrderItem = {
          id: uuidv4(),
          productId,
          name,
          quantity: 1,
          price,
        };
        const updatedOrder = {
          ...currentOrder,
          items: [...currentOrder.items, newItem],
          total: currentOrder.total + price,
          updatedAt: new Date().toISOString(),
        };
        setCurrentOrder(updatedOrder);
      }
    }
  };

  // Function to remove an item from the current order
  const removeItemFromOrder = (itemId: string) => {
    if (!currentOrder) return;

    const itemToRemove = currentOrder.items.find((item) => item.id === itemId);

    if (!itemToRemove) return;

    const updatedItems = currentOrder.items.filter((item) => item.id !== itemId);
    const updatedTotal = currentOrder.total - itemToRemove.price * itemToRemove.quantity;

    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      total: updatedTotal,
      updatedAt: new Date().toISOString(),
    };

    setCurrentOrder(updatedOrder);
  };

  // Function to update the quantity of an item in the current order
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (!currentOrder) return;

    const itemToUpdate = currentOrder.items.find((item) => item.id === itemId);

    if (!itemToUpdate) return;

    const quantityDiff = quantity - itemToUpdate.quantity;
    const priceDiff = quantityDiff * itemToUpdate.price;

    const updatedItems = currentOrder.items.map((item) =>
      item.id === itemId ? { ...item, quantity: quantity } : item
    );
    const updatedTotal = currentOrder.total + priceDiff;

    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      total: updatedTotal,
      updatedAt: new Date().toISOString(),
    };

    setCurrentOrder(updatedOrder);
  };

  // Function to clear the current order
  const clearOrder = () => {
    setCurrentOrder(null);
  };

  // Function to create a new order
  const createOrder = async (paymentMethod: string) => {
    if (!currentOrder) {
      toast.error("Não há itens no pedido.");
      return;
    }

    if (currentOrder.items.length === 0) {
      toast.error("Não há itens no pedido.");
      return;
    }

    try {
      const { error } = await supabase.from("orders").insert([
        {
          id: currentOrder.id,
          items: currentOrder.items,
          total: currentOrder.total,
          payment_method: paymentMethod,
          status: "completed",
          created_at: currentOrder.createdAt,
          completed_at: new Date().toISOString(),
          user_id: user?.id || null,
          username: user?.name || user?.username || null,
        },
      ]);

      if (error) {
        throw error;
      }

      const newOrder: Order = {
        ...currentOrder,
        paymentMethod,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      
      setOrders([newOrder, ...orders]);
      setCurrentOrder(null);
      toast.success("Pedido criado com sucesso!");
      await fetchOrders(); // Refresh orders after creating a new one
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      toast.error("Erro ao criar pedido.");
    }
  };

  // Function to cancel an order
  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" as const } : order
      );
      setOrders(updatedOrders);
      toast.success("Pedido cancelado com sucesso!");
    } catch (error: any) {
      console.error("Error cancelling order:", error.message);
      toast.error("Erro ao cancelar pedido.");
    }
  };

  // Function to complete an order
  const completeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: "completed" as const } : order
      );
      setOrders(updatedOrders);
      toast.success("Pedido concluído com sucesso!");
    } catch (error: any) {
      console.error("Error completing order:", error.message);
      toast.error("Erro ao concluir pedido.");
    }
  };
  
  // Function to mark an order as ready (for kitchen)
  const markOrderAsReady = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "preparing" })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: "preparing" as const } : order
      );
      setOrders(updatedOrders);
      toast.success("Pedido marcado como preparando!");
    } catch (error: any) {
      console.error("Error marking order as ready:", error.message);
      toast.error("Erro ao atualizar status do pedido.");
    }
  };

  // Function to delete an order
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);

      if (error) {
        throw error;
      }

      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);
      toast.success("Pedido excluído com sucesso!");
    } catch (error: any) {
      console.error("Error deleting order:", error.message);
      toast.error("Erro ao excluir pedido.");
    }
  };
  
  // Métodos de compatibilidade para POS.tsx
  const addItem = (product: any, quantity: number) => {
    addItemToOrder(product.id, product.name, product.price);
  };
  
  const removeItem = (index: number) => {
    if (!currentOrder || !currentOrder.items[index]) return;
    removeItemFromOrder(currentOrder.items[index].id);
  };
  
  const updateItem = (index: number, quantity: number, notes?: string) => {
    if (!currentOrder || !currentOrder.items[index]) return;
    
    const itemId = currentOrder.items[index].id;
    updateItemQuantity(itemId, quantity);
    
    // Atualize as notas se fornecidas
    if (notes !== undefined) {
      // Atualize as notas do item
      if (!currentOrder) return;
      
      const updatedItems = currentOrder.items.map((item, i) =>
        i === index ? { ...item, notes } : item
      );
      
      setCurrentOrder({
        ...currentOrder,
        items: updatedItems,
      });
    }
  };

  // Provide the context value
  const value: OrderContextType = {
    orders,
    currentOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    clearOrder,
    createOrder,
    cancelOrder,
    completeOrder,
    fetchOrders,
    deleteOrder,
    getOrdersByDate,
    getOrdersByDateRange,
    getOrdersTotal,
    markOrderAsReady,
    // Aliases para compatibilidade com POS.tsx
    addItem,
    removeItem,
    updateItem,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

// Create the hook
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within a OrderProvider");
  }
  return context;
};
