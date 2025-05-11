import React, { useState, useEffect } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import AppShell from '@/components/Layout/AppShell';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

const Kitchen: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  
  // Filtrar apenas pedidos pendentes ou em preparo
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  useEffect(() => {
    const filteredOrders = orders.filter(
      order => order.status === 'pending' || order.status === 'preparing'
    );
    setActiveOrders(filteredOrders);
  }, [orders]);

  const handleStatusUpdate = (orderId: string, status: string) => {
    // Verificar se a função existe antes de chamá-la
    if (updateOrderStatus) {
      updateOrderStatus(orderId, status);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'preparing':
        return <Badge>Em preparo</Badge>;
      case 'ready':
        return <Badge variant="secondary">Pronto</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatOrderTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  return (
    
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Cozinha</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido em espera ou em preparo.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <Card key={order.id} className={order.status === 'pending' ? 'border-orange-400 border-2' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Pedido #{order.id.substring(0, 8)}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Horário: {formatOrderTime(order.createdAt)}
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Qtd</TableHead>
                        <TableHead>Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.quantity}x</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground">{item.notes}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  {order.status === 'pending' ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    >
                      Iniciar Preparo
                    </Button>
                  ) : order.status === 'preparing' ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                    >
                      Marcar como Pronto
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      {order.status === 'ready' ? 'Aguardando Retirada' : 'Finalizado'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
    
  );
};

export default Kitchen;
