
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
  productId: string; // Adicionado para compatibilidade
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
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  
  // Adicionando métodos faltantes que estão sendo usados em outras partes do código
  currentOrder?: {
    items: OrderItem[];
  };
  addItem: (product: any, quantity: number) => void;
  updateItem: (index: number, quantity: number, notes?: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
  createOrder: (paymentMethod: string) => void;
  getOrdersByDate?: (date: Date) => Order[];
}

// Create the order context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Order context provider component
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<{ items: OrderItem[] } | undefined>({ items: [] });

  // Function to add a new order
  const addOrder = async (order: NewOrder) => {
    try {
      const orderId = uuidv4();
      const createdAt = new Date().toISOString();
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id || 'anonymous';
      const userName = (await user).data.user?.user_metadata?.name || 'Anonymous';

      // Extrair apenas os dados que o Supabase espera
      const { error } = await supabase.from("orders").insert([
        {
          id: orderId,
          created_at: createdAt,
          total: order.total,
          payment_method: order.paymentMethod,
          status: "pending", // Default status
          user_id: userId,
          username: userName,
        },
      ]);

      if (error) throw error;

      // Inserir os itens separadamente
      const orderItems = order.items.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      
      if (itemsError) throw itemsError;

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
      // Converter formato dos dados para o formato esperado pelo Supabase
      const supabaseData: any = {};
      
      if (data.status) supabaseData.status = data.status;
      if (data.total) supabaseData.total = data.total;
      if (data.paymentMethod) supabaseData.payment_method = data.paymentMethod;
      
      const { error } = await supabase
        .from("orders")
        .update(supabaseData)
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

  // Function to update an order status
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

  // Function to get orders by date range
  const getOrdersByDateRange = (startDate: Date, endDate: Date): Order[] => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  // Function to get orders by specific date
  const getOrdersByDate = (date: Date): Order[] => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getDate() === date.getDate() &&
        orderDate.getMonth() === date.getMonth() &&
        orderDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Function to calculate the total value of orders
  const getOrdersTotal = (ordersToCalculate?: Order[]): number => {
    const ordersToUse = ordersToCalculate || orders;
    return ordersToUse.reduce((total, order) => total + order.total, 0);
  };

  // Métodos de manipulação do pedido atual
  const addItem = (product: any, quantity: number) => {
    setCurrentOrder(prev => {
      if (!prev) return { items: [{ 
        id: uuidv4(), 
        productId: product.id,
        name: product.name, 
        price: product.price, 
        quantity 
      }]};
      
      return {
        items: [...prev.items, { 
          id: uuidv4(), 
          productId: product.id,
          name: product.name, 
          price: product.price, 
          quantity 
        }]
      };
    });
  };

  const updateItem = (index: number, quantity: number, notes?: string) => {
    setCurrentOrder(prev => {
      if (!prev) return { items: [] };
      
      const updatedItems = [...prev.items];
      updatedItems[index] = { 
        ...updatedItems[index], 
        quantity,
        ...(notes !== undefined && { notes })
      };
      
      return { items: updatedItems };
    });
  };

  const removeItem = (index: number) => {
    setCurrentOrder(prev => {
      if (!prev) return { items: [] };
      
      const updatedItems = prev.items.filter((_, idx) => idx !== index);
      return { items: updatedItems };
    });
  };

  const clearOrder = () => {
    setCurrentOrder({ items: [] });
  };

  const createOrder = (paymentMethod: string) => {
    if (!currentOrder || currentOrder.items.length === 0) return;
    
    const total = currentOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    
    addOrder({
      items: currentOrder.items,
      total,
      paymentMethod
    });
    
    clearOrder();
  };

  // Load orders from Supabase on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Buscar pedidos
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        if (ordersData) {
          // Buscar os itens para cada pedido
          const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
            const { data: items, error: itemsError } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);
            
            if (itemsError) {
              console.error("Error fetching order items:", itemsError.message);
              return null;
            }
            
            // Converter os dados para o formato do frontend
            return {
              id: order.id,
              createdAt: order.created_at,
              items: items ? items.map((item) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product_name,
                price: item.unit_price,
                quantity: item.quantity,
                notes: item.notes
              })) : [],
              total: order.total,
              paymentMethod: order.payment_method,
              status: order.status
            };
          }));
          
          // Filtrar quaisquer pedidos que não puderam ser carregados
          const validOrders = ordersWithItems.filter(order => order !== null) as Order[];
          setOrders(validOrders);
        }
      } catch (error: any) {
        console.error("Error fetching orders:", error.message);
        toast.error("Erro ao carregar pedidos");
      }
    };

    fetchOrders();
  }, []);

  // Aqui está o problema principal: em vez de retornar o objeto do contexto diretamente,
  // precisamos retornar o Provider com o children
  return (
    <OrderContext.Provider 
      value={{
        orders,
        addOrder,
        updateOrder,
        getOrdersByDateRange,
        getOrdersTotal,
        updateOrderStatus,
        currentOrder,
        addItem,
        updateItem,
        removeItem,
        clearOrder,
        createOrder,
        getOrdersByDate
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within a OrderProvider");
  }
  return context;
};
