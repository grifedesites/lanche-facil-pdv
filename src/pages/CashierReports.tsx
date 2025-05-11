
import React, { useState } from 'react';
import AppShell from '@/components/Layout/AppShell';
import { useCashier } from '@/contexts/CashierContext';
import { useOrders } from '@/contexts/OrderContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search } from 'lucide-react';

const CashierReports: React.FC = () => {
  const { cashHistoryRecords } = useCashier();
  const { orders } = useOrders();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredRecords = selectedDate 
    ? cashHistoryRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return (
          recordDate.getDate() === selectedDate.getDate() &&
          recordDate.getMonth() === selectedDate.getMonth() &&
          recordDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : cashHistoryRecords;

  const openingRecord = filteredRecords.find(record => record.action === 'open');
  const closingRecord = filteredRecords.find(record => record.action === 'close');

  // Função para calcular totais de vendas filtrados pela data
  const getSalesData = () => {
    if (!selectedDate) return { total: 0, count: 0, byMethod: {} };

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getDate() === selectedDate.getDate() &&
        orderDate.getMonth() === selectedDate.getMonth() &&
        orderDate.getFullYear() === selectedDate.getFullYear() &&
        order.status === 'completed'
      );
    });

    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    
    const byMethod: Record<string, { amount: number, count: number }> = {};
    
    filteredOrders.forEach(order => {
      if (!byMethod[order.paymentMethod]) {
        byMethod[order.paymentMethod] = { amount: 0, count: 0 };
      }
      byMethod[order.paymentMethod].amount += order.total;
      byMethod[order.paymentMethod].count += 1;
    });
    
    return { 
      total: totalAmount, 
      count: filteredOrders.length,
      byMethod
    };
  };

  const salesData = getSalesData();
  const formattedDate = selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : '';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX'
    };
    
    return methods[method] || method;
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Relatório de Caixa</h1>
        
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
            <div>
              <Label htmlFor="date">Selecione uma data</Label>
              <DatePicker
                date={selectedDate}
                setDate={setSelectedDate}
                locale={ptBR}
              />
            </div>
            
            <div className="flex items-end gap-2">
              {selectedDate && (
                <Button variant="outline" onClick={handleClearDate}>
                  Limpar Filtro
                </Button>
              )}
            </div>
          </div>
          
          {selectedDate && (
            <div className="text-lg mb-2">
              Exibindo relatório de: <span className="font-semibold">{formattedDate}</span>
            </div>
          )}
        </div>
        
        {selectedDate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Abertura de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                {openingRecord ? (
                  <div>
                    <div><span className="font-semibold">Valor Inicial:</span> {formatCurrency(openingRecord.amount)}</div>
                    <div><span className="font-semibold">Data/Hora:</span> {format(new Date(openingRecord.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                    <div><span className="font-semibold">Responsável:</span> {openingRecord.userName}</div>
                    {openingRecord.notes && <div><span className="font-semibold">Observações:</span> {openingRecord.notes}</div>}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Nenhum registro de abertura encontrado para esta data.</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fechamento de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                {closingRecord ? (
                  <div>
                    <div><span className="font-semibold">Valor Final:</span> {formatCurrency(closingRecord.amount)}</div>
                    <div><span className="font-semibold">Data/Hora:</span> {format(new Date(closingRecord.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                    <div><span className="font-semibold">Responsável:</span> {closingRecord.userName}</div>
                    {closingRecord.notes && <div><span className="font-semibold">Observações:</span> {closingRecord.notes}</div>}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Nenhum registro de fechamento encontrado para esta data.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo de Vendas {selectedDate ? `(${formattedDate})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total de Vendas</div>
                    <div className="text-2xl font-bold">{formatCurrency(salesData.total)}</div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Número de Pedidos</div>
                    <div className="text-2xl font-bold">{salesData.count}</div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Ticket Médio</div>
                    <div className="text-2xl font-bold">
                      {salesData.count > 0 ? formatCurrency(salesData.total / salesData.count) : formatCurrency(0)}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-3">Vendas por Método de Pagamento</h3>
                
                {Object.keys(salesData.byMethod).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Qtd. Pedidos</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(salesData.byMethod).map(([method, data]) => (
                        <TableRow key={method}>
                          <TableCell>{getPaymentMethodName(method)}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(data.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma venda registrada nesta data.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione uma data para visualizar o resumo de vendas.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Operações de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>
                        {record.action === 'open' ? 'Abertura' : 
                        record.action === 'close' ? 'Fechamento' : 
                        record.action === 'add' ? 'Adição' : 
                        record.action === 'remove' ? 'Retirada' : 
                        record.action}
                      </TableCell>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(record.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {selectedDate 
                  ? 'Nenhuma operação de caixa registrada nesta data.' 
                  : 'Selecione uma data para filtrar o histórico de operações.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default CashierReports;
