
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/Layout/AppShell';
import { useOrders, Order, OrderStatus } from '@/contexts/OrderContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Kitchen: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [selectedTab, setSelectedTab] = useState<string>("pending");

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
    toast.success('Pedido em preparo');
  };

  const handleMarkAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
    toast.success('Pedido pronto para entrega');
  };

  const handleCompleteOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'completed');
    toast.success('Pedido concluído');
  };

  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
    toast.error('Pedido cancelado');
  };

  const formatDateTime = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'preparing':
        return <Badge variant="secondary">Em Preparo</Badge>;
      case 'ready':
        return <Badge variant="default">Pronto</Badge>;
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const renderOrderCard = (order: Order) => {
    return (
      <Card key={order.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pedido #{order.id.substring(0, 8)}</CardTitle>
            {getStatusBadge(order.status)}
          </div>
          <div className="text-sm text-muted-foreground">
            Criado: {formatDateTime(new Date(order.createdAt))} por {order.createdByName}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.productName}
                  {item.notes && <div className="text-xs italic text-muted-foreground">{item.notes}</div>}
                </div>
                <div>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.unitPrice * item.quantity
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2 border-t border-border">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  order.total
                )}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Pagamento: {order.paymentMethod === 'dinheiro' ? 'Dinheiro' : 
                      order.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : 
                      order.paymentMethod === 'cartao_debito' ? 'Cartão de Débito' : 
                      order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {order.status === 'pending' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleCancelOrder(order.id)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => handleStartPreparing(order.id)}>
                Iniciar Preparo
              </Button>
            </>
          )}
          {order.status === 'preparing' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleCancelOrder(order.id)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => handleMarkAsReady(order.id)}>
                Pronto para Entrega
              </Button>
            </>
          )}
          {order.status === 'ready' && (
            <Button size="sm" onClick={() => handleCompleteOrder(order.id)}>
              Concluir Pedido
            </Button>
          )}
          {order.status === 'completed' && order.completedAt && (
            <div className="text-sm text-muted-foreground">
              Concluído em: {formatDateTime(new Date(order.completedAt))}
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <AppShell>
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-6">Cozinha - Gerenciamento de Pedidos</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="pending">Pendentes <Badge variant="outline" className="ml-2">{pendingOrders.length}</Badge></TabsTrigger>
            <TabsTrigger value="preparing">Em Preparo <Badge variant="outline" className="ml-2">{preparingOrders.length}</Badge></TabsTrigger>
            <TabsTrigger value="ready">Prontos <Badge variant="outline" className="ml-2">{readyOrders.length}</Badge></TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum pedido pendente.</p>}
            {pendingOrders.map(renderOrderCard)}
          </TabsContent>

          <TabsContent value="preparing" className="space-y-4">
            {preparingOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum pedido em preparo.</p>}
            {preparingOrders.map(renderOrderCard)}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum pedido pronto para entrega.</p>}
            {readyOrders.map(renderOrderCard)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum pedido concluído.</p>}
            {completedOrders.map(renderOrderCard)}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum pedido cancelado.</p>}
            {cancelledOrders.map(renderOrderCard)}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Kitchen;
