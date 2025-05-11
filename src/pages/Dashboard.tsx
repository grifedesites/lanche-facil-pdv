
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/contexts/OrderContext";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#2563EB", "#F97316", "#10B981", "#8B5CF6"];

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

const Dashboard: React.FC = () => {
  const { orders, getOrdersByDateRange, getOrdersTotal } = useOrders();
  const today = new Date();
  
  // Dados para os gráficos
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const dayOrders = getOrdersByDateRange(startOfDay, endOfDay);
    const total = getOrdersTotal(dayOrders);
    
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      vendas: total,
      pedidos: dayOrders.filter(o => o.status === "completed").length,
    };
  });

  const ordersByPayment = orders
    .filter(order => order.status === "completed")
    .reduce((acc: any[], order) => {
      const paymentMethod = order.paymentMethod || "Não especificado";
      const existingPayment = acc.find(p => p.name === paymentMethod);
      
      if (existingPayment) {
        existingPayment.value += order.total;
      } else {
        acc.push({ name: paymentMethod, value: order.total });
      }
      
      return acc;
    }, []);

  // Calcular totalizadores
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const todayOrders = getOrdersByDateRange(todayStart, todayEnd);
  const todayTotal = getOrdersTotal(todayOrders);
  
  const yesterdayStart = new Date(subDays(today, 1));
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(subDays(today, 1));
  yesterdayEnd.setHours(23, 59, 59, 999);
  
  const yesterdayOrders = getOrdersByDateRange(yesterdayStart, yesterdayEnd);
  const yesterdayTotal = getOrdersTotal(yesterdayOrders);
  
  const last7DaysStart = new Date(subDays(today, 6));
  last7DaysStart.setHours(0, 0, 0, 0);
  
  const last7DaysOrders = getOrdersByDateRange(last7DaysStart, todayEnd);
  const last7DaysTotal = getOrdersTotal(last7DaysOrders);
  
  const ticketMedio = todayOrders.length > 0 
    ? todayTotal / todayOrders.filter(o => o.status === "completed").length 
    : 0;

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vendas hoje</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(todayTotal)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {todayOrders.filter(o => o.status === "completed").length} pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vendas ontem</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(yesterdayTotal)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {yesterdayOrders.filter(o => o.status === "completed").length} pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vendas últimos 7 dias</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(last7DaysTotal)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {last7DaysOrders.filter(o => o.status === "completed").length} pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ticket médio (hoje)</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(ticketMedio)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                por pedido
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vendas">
          <TabsList className="mb-4">
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="pagamentos">Métodos de Pagamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vendas">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Vendas dos últimos 7 dias</CardTitle>
                <CardDescription>Evolução diária das vendas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7Days}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `R$ ${value}`} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="#2563EB" 
                      fillOpacity={1} 
                      fill="url(#colorVendas)" 
                      name="Vendas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pagamentos">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Vendas por método de pagamento</CardTitle>
                <CardDescription>Distribuição das vendas por forma de pagamento</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByPayment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {ordersByPayment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Dashboard;
