
import React, { useState } from "react";
import { format, isEqual, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, Search } from "lucide-react";
import AppShell from "@/components/Layout/AppShell";
import { useCashier } from "@/contexts/CashierContext";
import { useOrders } from "@/contexts/OrderContext";
import { supabase } from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipos para os relatórios de caixa
interface CashierReport {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
  initialBalance: number;
  closingBalance: number | null;
  operations: {
    inflows: number;
    outflows: number;
    sales: number;
  };
  reconciliation?: {
    method: string;
    reported: number;
    expected?: number;
  }[];
}

const CashierReports = () => {
  const { cashierOperations } = useCashier();
  const { getOrdersByDateRange } = useOrders();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reports, setReports] = useState<CashierReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Carregar relatórios de caixa para a data selecionada
  const loadCashierReports = async () => {
    setIsLoading(true);
    const startDate = startOfDay(selectedDate);
    const endDate = endOfDay(selectedDate);

    try {
      // Busca os caixas abertos ou fechados na data
      const { data: cashiers, error: cashiersError } = await supabase
        .from('cashiers')
        .select('*')
        .or(`opened_at.gte.${startDate.toISOString()},opened_at.lte.${endDate.toISOString()},closed_at.gte.${startDate.toISOString()},closed_at.lte.${endDate.toISOString()}`)
        .order('opened_at', { ascending: true });

      if (cashiersError) throw cashiersError;

      if (!cashiers || cashiers.length === 0) {
        setReports([]);
        toast.info("Nenhum registro de caixa encontrado para essa data.");
        setIsLoading(false);
        return;
      }

      // Buscar operações de caixa para cada caixa
      const reportsData: CashierReport[] = await Promise.all(
        cashiers.map(async (cashier) => {
          // Para cada caixa, obter as operações de entrada/saída
          const { data: operations } = await supabase
            .from('cashier_operations')
            .select('*')
            .eq('user_id', cashier.opened_by)
            .gte('timestamp', cashier.opened_at)
            .lte('timestamp', cashier.closed_at || endDate.toISOString());
          
          // Buscar reconciliação se o caixa foi fechado
          let reconciliation = [];
          if (cashier.closed_at) {
            const { data: reconData } = await supabase
              .from('cashier_reconciliation')
              .select('*')
              .eq('cashier_id', cashier.id);
            
            if (reconData && reconData.length > 0) {
              reconciliation = reconData.map(r => ({
                method: r.payment_method,
                reported: r.reported_amount,
              }));
            }
          }

          // Calcular totais de operações
          const inflows = operations?.filter(op => op.type === 'inflow' || op.type === 'opening')
            .reduce((sum, op) => sum + parseFloat(op.amount), 0) || 0;
          
          const outflows = operations?.filter(op => op.type === 'outflow')
            .reduce((sum, op) => sum + parseFloat(op.amount), 0) || 0;
          
          const sales = operations?.filter(op => op.type === 'sale')
            .reduce((sum, op) => sum + parseFloat(op.amount), 0) || 0;

          return {
            id: cashier.id,
            openedAt: cashier.opened_at,
            closedAt: cashier.closed_at,
            openedBy: cashier.opened_by_name,
            closedBy: cashier.closed_by_name,
            initialBalance: parseFloat(cashier.initial_balance),
            closingBalance: cashier.closing_balance ? parseFloat(cashier.closing_balance) : null,
            operations: {
              inflows,
              outflows,
              sales
            },
            reconciliation
          };
        })
      );

      setReports(reportsData);
    } catch (error) {
      console.error('Erro ao buscar relatórios de caixa:', error);
      toast.error("Erro ao buscar relatórios de caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Exportar relatório como CSV
  const exportReportCSV = (cashierId: string) => {
    const report = reports.find(r => r.id === cashierId);
    if (!report) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Relatório de Caixa\n";
    csvContent += `Data de Abertura,${formatDateTime(report.openedAt)}\n`;
    csvContent += `Aberto por,${report.openedBy}\n`;
    csvContent += `Saldo Inicial,${formatCurrency(report.initialBalance)}\n`;
    csvContent += `Data de Fechamento,${formatDateTime(report.closedAt)}\n`;
    csvContent += `Fechado por,${report.closedBy || "—"}\n`;
    csvContent += `Saldo Final,${report.closingBalance ? formatCurrency(report.closingBalance) : "—"}\n\n`;
    
    csvContent += "Operações\n";
    csvContent += `Entradas,${formatCurrency(report.operations.inflows)}\n`;
    csvContent += `Saídas,${formatCurrency(report.operations.outflows)}\n`;
    csvContent += `Vendas,${formatCurrency(report.operations.sales)}\n`;
    
    if (report.reconciliation && report.reconciliation.length > 0) {
      csvContent += "\nReconciliação\n";
      csvContent += "Método,Valor Reportado\n";
      report.reconciliation.forEach(r => {
        csvContent += `${r.method},${formatCurrency(r.reported)}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio-caixa-${format(new Date(report.openedAt), "dd-MM-yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Relatórios de Caixa</h1>
        </div>

        {/* Filtro de data */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={loadCashierReports} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? "Carregando..." : "Buscar"}
          </Button>
        </div>

        {/* Relatórios de Caixa */}
        {reports.length > 0 ? (
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Caixa {report.id.substring(0, 8)}</CardTitle>
                      <CardDescription>
                        Aberto em {formatDateTime(report.openedAt)} por {report.openedBy}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.closedAt ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Fechado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Aberto
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => exportReportCSV(report.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="summary">
                    <TabsList className="mb-4">
                      <TabsTrigger value="summary">Resumo</TabsTrigger>
                      {report.reconciliation && report.reconciliation.length > 0 && (
                        <TabsTrigger value="reconciliation">Reconciliação</TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="summary">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold mb-4">Informações do Caixa</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Saldo Inicial</TableCell>
                                <TableCell className="text-right">{formatCurrency(report.initialBalance)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Entradas (+)</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(report.operations.inflows)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Saídas (-)</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(report.operations.outflows)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Vendas (+)</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(report.operations.sales)}</TableCell>
                              </TableRow>
                              <TableRow className="border-t-2">
                                <TableCell className="font-medium">Saldo Final</TableCell>
                                <TableCell className="text-right font-bold">
                                  {report.closingBalance 
                                    ? formatCurrency(report.closingBalance)
                                    : formatCurrency(report.initialBalance + report.operations.inflows + report.operations.sales - report.operations.outflows)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold mb-4">Detalhes</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Data de Abertura</TableCell>
                                <TableCell>{formatDateTime(report.openedAt)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Aberto por</TableCell>
                                <TableCell>{report.openedBy}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Data de Fechamento</TableCell>
                                <TableCell>{formatDateTime(report.closedAt)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Fechado por</TableCell>
                                <TableCell>{report.closedBy || "—"}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    {report.reconciliation && report.reconciliation.length > 0 && (
                      <TabsContent value="reconciliation">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Método de Pagamento</TableHead>
                                <TableHead className="text-right">Valor Reportado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.reconciliation.map((rec, index) => (
                                <TableRow key={index}>
                                  <TableCell>{rec.method}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(rec.reported)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell className="font-medium">Total</TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(
                                    report.reconciliation.reduce((sum, item) => sum + item.reported, 0)
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-muted/20 border rounded-md p-8 text-center">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando relatórios..." : "Selecione uma data e clique em buscar para ver os relatórios de caixa."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CashierReports;
