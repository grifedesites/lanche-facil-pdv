
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Order, OrderFormItem, OrderStatus } from '@/types/order.types';
import { Product } from '@/contexts/ProductContext';

export const useOrderActions = () => {
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

  return {
    orders,
    currentOrder,
    addItem,
    updateItem,
    removeItem,
    clearOrder,
    completeOrder,
    updateOrderStatus
  };
};
