
import { Order, OrderStatus } from "@/types/order.types";
import { startOfDay, endOfDay } from "date-fns";

export const getOrdersByDateRange = (orders: Order[], startDate: Date, endDate: Date): Order[] => {
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

export const getOrdersTotal = (orders: Order[]): number => {
  return orders
    .filter(order => order.status === 'completed')
    .reduce((total, order) => total + order.total, 0);
};

export const getFilteredOrders = (orders: Order[], status?: OrderStatus): Order[] => {
  if (!status) return orders;
  return orders.filter(order => order.status === status);
};
