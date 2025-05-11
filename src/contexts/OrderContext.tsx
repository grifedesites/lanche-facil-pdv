import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define the structure of an order item
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Define the structure of an order
export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: string;
}

// Define the structure for creating a new order
export interface NewOrder {
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

export interface OrderContextType {
  orders: Order[];
  addOrder: (order: NewOrder) => Promise<void>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getOrdersTotal: (ordersToCalculate?: Order[]) => number;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>; // Adicionado essa propriedade
}

// Create the order context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Order context provider component
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Function to add a new order
  const addOrder = async (order: NewOrder) => {
    try {
      const orderId = uuidv4();
      const createdAt = new Date().toISOString();

      const { error } = await supabase.from("orders").insert([
        {
          id: orderId,
          created_at: createdAt,
          items: order.items,
          total: order.total,
          payment_method: order.paymentMethod,
          status: "pending", // Default status
        },
      ]);

      if (error) throw error;

      // Optimistically update the local state
      const newOrder = {
        id: orderId,
        createdAt,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: "pending",
      };
      setOrders((prevOrders) => [...prevOrders, newOrder]);

      toast.success("Pedido adicionado com sucesso!");
    } catch (error: any) {
      console.error("Error adding order:", error.message);
      toast.error("Erro ao adicionar pedido");
    }
  };

  // Function to update an existing order
  const updateOrder = async (id: string, data: Partial<Order>) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === id ? { ...order, ...data } : order))
      );

      toast.success("Pedido atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating order:", error.message);
      toast.error("Erro ao atualizar pedido");
    }
  };

  // Function to get orders by date range
  const getOrdersByDateRange = (startDate: Date, endDate: Date): Order[] => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Function to calculate the total value of orders
  const getOrdersTotal = (ordersToCalculate?: Order[]): number => {
    const ordersToUse = ordersToCalculate || orders;
    return ordersToUse.reduce((total, order) => total + order.total, 0);
  };

  // Load orders from Supabase on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          // Type cast the data to Order[]
          setOrders(data as Order[]);
        }
      } catch (error: any) {
        console.error("Error fetching orders:", error.message);
        toast.error("Erro ao carregar pedidos");
      }
    };

    fetchOrders();
  }, []);

  // Adicionar ou garantir que a função updateOrderStatus está definida
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      // Atualizar o estado local
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast.success(`Status do pedido atualizado para: ${status}`);
    } catch (error: any) {
      console.error("Error updating order status:", error.message);
      toast.error("Erro ao atualizar o status do pedido");
    }
  };

  return {
    orders,
    addOrder,
    updateOrder,
    getOrdersByDateRange,
    getOrdersTotal,
    updateOrderStatus,  // Adicionando essa função ao retorno
  };
};

// Custom hook to use the order context
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within a OrderProvider");
  }
  return context;
};
