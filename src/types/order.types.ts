
import { Product } from "@/contexts/ProductContext";

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
