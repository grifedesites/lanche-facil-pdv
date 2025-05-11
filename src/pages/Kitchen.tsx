import React, { useState, useEffect } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useOrders, Order, OrderItem } from "@/contexts/OrderContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const Kitchen: React.FC = () => {
  const { orders, completeOrder, markOrderAsReady, fetchOrders } = useOrders();
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    // Fetch orders when component mounts
    fetchOrders();
    
    // Set up polling to refresh orders every 30 seconds
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "pending") return order.status === "pending";
    if (activeTab === "preparing") return order.status === "preparing";
    return false;
  });

  const handleMarkAsReady = async (orderId: string) => {
    if (markOrderAsReady) {
      await markOrderAsReady(orderId);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    await completeOrder(orderId);
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return "Data inválida";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pendente</Badge>;
      case "preparing":
        return <Badge variant="warning">Preparando</Badge>;
      case "completed":
        return <Badge variant="success">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Cozinha</h1>
        
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes
                {orders.filter(o => o.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {orders.filter(o => o.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preparing">
                Preparando
                {orders.filter(o => o.status === "preparing").length > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {orders.filter(o => o.status === "preparing").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <Button variant="outline" onClick={() => fetchOrders()}>
              Atualizar
            </Button>
          </div>
          
          <TabsContent value="pending" className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Não há pedidos pendentes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    timeAgo={getTimeAgo(order.createdAt)}
                    statusBadge={getStatusBadge(order.status)}
                    onMarkAsReady={() => handleMarkAsReady(order.id)}
                    onComplete={() => handleCompleteOrder(order.id)}
                    isPending={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preparing" className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Não há pedidos em preparação.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    timeAgo={getTimeAgo(order.createdAt)}
                    statusBadge={getStatusBadge(order.status)}
                    onMarkAsReady={() => handleMarkAsReady(order.id)}
                    onComplete={() => handleCompleteOrder(order.id)}
                    isPending={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

interface OrderCardProps {
  order: Order;
  timeAgo: string;
  statusBadge: React.ReactNode;
  onMarkAsReady: () => void;
  onComplete: () => void;
  isPending: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  timeAgo,
  statusBadge,
  onMarkAsReady,
  onComplete,
  isPending,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">Pedido #{order.id.slice(0, 8)}</h3>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
          {statusBadge}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Itens:</h4>
          <ul className="space-y-2">
            {order.items.map((item: OrderItem) => (
              <li key={item.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {item.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 p-4 flex justify-end gap-2">
        {isPending ? (
          <Button onClick={onMarkAsReady}>Iniciar Preparo</Button>
        ) : (
          <Button onClick={onComplete}>Concluir Pedido</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Kitchen;
