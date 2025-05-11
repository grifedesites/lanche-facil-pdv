
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useOrders, Order, OrderStatus } from "@/contexts/OrderContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChefHat, Clock, Check, Package, Utensils } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Kitchen: React.FC = () => {
  const { orders, markOrderAsReady } = useOrders();
  const [activeTab, setActiveTab] = useState<OrderStatus>("preparing");

  // Filtra os pedidos com base na tab ativa
  const filteredOrders = orders.filter(order => order.status === activeTab);

  // Calcula o tempo decorrido desde a criação do pedido
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  // Retorna a cor do card baseada no status do pedido
  const getCardStyle = (order: Order) => {
    switch (order.status) {
      case "preparing":
        return "border-l-4 border-l-yellow-500";
      case "completed":
        return "border-l-4 border-l-green-500";
      case "cancelled":
        return "border-l-4 border-l-red-500";
      default:
        return "";
    }
  };

  // Retorna o ícone e cor baseado no status do pedido
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "preparing":
        return { 
          color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", 
          icon: <Utensils className="h-4 w-4 mr-1" />,
          label: "Em preparo"
        };
      case "completed":
        return { 
          color: "bg-green-100 text-green-800 hover:bg-green-200", 
          icon: <Check className="h-4 w-4 mr-1" />,
          label: "Concluído"
        };
      case "cancelled":
        return { 
          color: "bg-red-100 text-red-800 hover:bg-red-200", 
          icon: null,
          label: "Cancelado"
        };
      case "pending":
        return { 
          color: "bg-blue-100 text-blue-800 hover:bg-blue-200", 
          icon: <Clock className="h-4 w-4 mr-1" />,
          label: "Pendente"
        };
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Cozinha</h1>
            <p className="text-muted-foreground">Gerencie os pedidos em preparo</p>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat size={24} className="text-primary" />
            <span className="font-semibold text-xl">Painel de Pedidos</span>
          </div>
        </div>

        <Tabs 
          defaultValue="preparing" 
          className="w-full" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as OrderStatus)}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="preparing" className="flex items-center gap-1">
              <Utensils className="h-4 w-4" /> Em Preparo
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1">
              <Check className="h-4 w-4" /> Prontos
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-1">
              Cancelados
            </TabsTrigger>
          </TabsList>

          {["preparing", "completed", "cancelled"].map((status) => (
            <TabsContent key={status} value={status} className="mt-0">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Nenhum pedido {status === "preparing" ? "em preparo" : 
                                 status === "completed" ? "concluído" : "cancelado"} no momento
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <Card 
                      key={order.id} 
                      className={`${getCardStyle(order)} transition-all hover:shadow-md`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>Pedido #{order.id}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={getStatusBadge(order.status).color}
                          >
                            {getStatusBadge(order.status).icon}
                            {getStatusBadge(order.status).label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {getElapsedTime(order.createdAt)}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ul className="divide-y">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="py-2 flex justify-between">
                              <span className="font-medium">
                                {item.quantity}x {item.productName}
                              </span>
                              {item.notes && (
                                <span className="text-sm italic text-muted-foreground ml-2">
                                  {item.notes}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter>
                        {order.status === "preparing" && (
                          <Button 
                            className="w-full" 
                            onClick={() => markOrderAsReady(order.id)}
                          >
                            <Check className="h-4 w-4 mr-2" /> Marcar como Pronto
                          </Button>
                        )}
                        {order.status === "completed" && (
                          <div className="w-full text-sm text-center text-muted-foreground">
                            Concluído {order.completedAt && formatDistanceToNow(new Date(order.completedAt), { 
                              addSuffix: true, locale: ptBR 
                            })}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Kitchen;
