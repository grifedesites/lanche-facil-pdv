// src/pages/Reports.tsx

import React, { useState, useEffect } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useOrders, Order } from "@/contexts/OrderContext";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/contexts/ProductContext";

const Reports: React.FC = () => {
  const { orders, getOrdersByDateRange, getOrdersTotal } = useOrders();
  const { products } = useProducts();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (date?.from && date?.to) {
      const ordersInDateRange = getOrdersByDateRange(date.from, date.to);
      setFilteredOrders(ordersInDateRange);
      setTotalRevenue(getOrdersTotal(ordersInDateRange));
    }
  }, [date, getOrdersByDateRange, getOrdersTotal]);

  const calculateProductSales = () => {
    const productSales: { [productId: string]: { name: string; quantity: number; revenue: number } } = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.quantity * item.price;
        } else {
          productSales[item.productId] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.quantity * item.price,
          };
        }
      });
    });

    return Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const productSalesReport = calculateProductSales();

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">Relatórios</h1>

        {/* Date Range Picker */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Selecione o período</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={
                      "w-[280px] justify-start text-left font-normal" +
                      (date?.from ? " text-sm" : " text-muted-foreground")
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    pagedNavigation
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Visão Geral da Receita</h2>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-sm text-muted-foreground">
              Receita total no período selecionado.
            </p>
          </CardContent>
        </Card>

        {/* Product Sales Report */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Relatório de Vendas por Produto</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Produto</TableHead>
                  <TableHead>Quantidade Vendida</TableHead>
                  <TableHead>Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesReport.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Reports;
