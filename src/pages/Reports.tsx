
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useOrders, Order } from "@/contexts/OrderContext";
import { useProducts } from "@/contexts/ProductContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText } from "lucide-react";

const Reports: React.FC = () => {
  const { orders, getOrdersByDateRange, getOrdersTotal } = useOrders();
  const { products, categories } = useProducts();
  const today = new Date();

  // Estado para filtro de data
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(today, 7),
    to: today,
  });

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Obter os pedidos filtrados pelo intervalo de datas
  const filteredOrders = date?.from && date?.to 
    ? getOrdersByDateRange(startOfDay(date.from), endOfDay(date.to || date.from))
    : orders;

  // Calcular o total de vendas no período
  const totalSales = getOrdersTotal(filteredOrders);

  // Calcular os produtos mais vendidos
  const getTopProducts = () => {
    const productCounts: Record<string, { productId: string, name: string, quantity: number, total: number }> = {};
    
    filteredOrders.forEach(order => {
      if (order.status === "completed") {
        order.items.forEach(item => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = {
              productId: item.productId,
              name: item.productName,
              quantity: 0,
              total: 0,
            };
          }
          productCounts[item.productId].quantity += item.quantity;
          productCounts[item.productId].total += item.quantity * item.unitPrice;
        });
      }
    });
    
    return Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

  // Calcular as vendas por dia para o gráfico
  const getSalesByDay = () => {
    if (!date?.from || !date?.to) return [];
    
    const salesByDay: Record<string, { date: string, formattedDate: string, sales: number }> = {};
    let currentDate = new Date(date.from);
    const endDate = date.to || date.from;
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, "yyyy-MM-dd");
      salesByDay[dateKey] = {
        date: dateKey,
        formattedDate: format(currentDate, "dd/MM", { locale: ptBR }),
        sales: 0,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    filteredOrders.forEach(order => {
      if (order.status === "completed") {
        const orderDate = format(new Date(order.createdAt), "yyyy-MM-dd");
        if (salesByDay[orderDate]) {
          salesByDay[orderDate].sales += order.total;
        }
      }
    });
    
    return Object.values(salesByDay);
  };

  // Calcular as vendas por método de pagamento
  const getSalesByPaymentMethod = () => {
    const paymentMethods: Record<string, { method: string, total: number }> = {
      "dinheiro": { method: "Dinheiro", total: 0 },
      "cartao_credito": { method: "Cartão de Crédito", total: 0 },
      "cartao_debito": { method: "Cartão de Débito", total: 0 },
      "pix": { method: "PIX", total: 0 },
    };
    
    filteredOrders.forEach(order => {
      if (order.status === "completed" && order.paymentMethod) {
        const method = order.paymentMethod;
        if (!paymentMethods[method]) {
          paymentMethods[method] = { method, total: 0 };
        }
        paymentMethods[method].total += order.total;
      }
    });
    
    return Object.values(paymentMethods).filter(payment => payment.total > 0);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const topProducts = getTopProducts();
  const dailySales = getSalesByDay();
  const paymentMethodSales = getSalesByPaymentMethod();

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Relatórios</h1>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {formatDate(date.from)} - {formatDate(date.to)}
                      </>
                    ) : (
                      formatDate(date.from)
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendas no período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de {filteredOrders.filter(o => o.status === "completed").length} pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pedidos por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(filteredOrders.filter(o => o.status === "completed").length / (dailySales.length || 1)).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média diária de pedidos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  totalSales / (filteredOrders.filter(o => o.status === "completed").length || 1)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor médio por pedido
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Vendas diárias</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis tickFormatter={(value) => `R$ ${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="sales" name="Vendas" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Produtos mais vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          Nenhuma venda no período selecionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      topProducts.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>{formatCurrency(product.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por método de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentMethodSales} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${value}`} />
                    <YAxis type="category" dataKey="method" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="total" name="Total" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Reports;
