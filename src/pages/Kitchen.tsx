import React, { useState, useEffect } from 'react';
import AppShell from '@/components/Layout/AppShell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  table: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
}

const Kitchen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulação de busca de pedidos (substitua pela sua lógica real)
    const fetchOrders = async () => {
      setLoading(true);
      //const response = await fetch('/api/orders');
      //const data = await response.json();
      const mockOrders: Order[] = [
        { id: '1', table: 1, items: [{ id: '1', name: 'Hamburguer', quantity: 2 }], status: 'pending' },
        { id: '2', table: 2, items: [{ id: '2', name: 'Pizza', quantity: 1 }], status: 'preparing' },
        { id: '3', table: 3, items: [{ id: '3', name: 'Salada', quantity: 1 }], status: 'ready' },
      ];
      setOrders(mockOrders);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast.success(`Pedido ${orderId} atualizado para ${newStatus}`);
  };

  if (loading) {
    return <AppShell><div className="container mx-auto">Carregando pedidos...</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Cozinha - Pedidos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Mesa {order.table} - Pedido #{order.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="default" onClick={() => handleStatusChange(order.id, 'pending')}>
                    Pendente
                  </Button>
                  <Button variant="default" onClick={() => handleStatusChange(order.id, 'preparing')}>
                    Preparando
                  </Button>
                  <Button variant="default" onClick={() => handleStatusChange(order.id, 'ready')}>
                    Pronto
                  </Button>
                  <Button variant="default" onClick={() => handleStatusChange(order.id, 'completed')}>
                    Concluído
                  </Button>
                </div>
                <div className="mt-4">
                  <span className="font-semibold">Status:</span> {order.status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Kitchen;
