
import React, { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/Layout/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const CashierReports: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 7));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [shortages, setShortages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("shortages");

  useEffect(() => {
    if (user) {
      fetchShortages();
    }
  }, [fromDate, toDate, reportType, user]);

  const fetchShortages = async () => {
    setLoading(true);
    try {
      const startTimestamp = startOfDay(fromDate).toISOString();
      const endTimestamp = endOfDay(toDate).toISOString();

      if (reportType === "shortages") {
        const { data, error } = await supabase
          .from('cashier_operations')
          .select('*')
          .eq('type', 'shortage')
          .gte('timestamp', startTimestamp)
          .lte('timestamp', endTimestamp)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setShortages(data || []);
      } else {
        // Para relatórios futuros de outras categorias
        setShortages([]);
      }
    } catch (error) {
      console.error('Error fetching shortages:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalShortages = shortages.reduce((sum, record) => sum + (record.amount || 0), 0);

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Relatórios de Caixa</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Selecione o período e o tipo de relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Tipo de Relatório</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shortages">Quebras de Caixa</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="movements">Movimentos de Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(fromDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => date && setFromDate(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(toDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => date && setToDate(date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório de Quebras de Caixa */}
        {reportType === "shortages" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  <div className="flex items-center">
                    <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                    Quebras de Caixa
                  </div>
                </CardTitle>
                <CardDescription>
                  Registro de valores divergentes ao fechar o caixa
                </CardDescription>
              </div>
              
              <Badge variant="destructive" className="text-base py-1.5">
                Total: R$ {totalShortages.toFixed(2)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : shortages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma quebra de caixa registrada no período selecionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shortages.map((shortage) => {
                        const date = new Date(shortage.timestamp);
                        return (
                          <TableRow key={shortage.id}>
                            <TableCell>{format(date, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{format(date, 'HH:mm')}</TableCell>
                            <TableCell>
                              {shortage.username || "Sistema"}
                            </TableCell>
                            <TableCell>{shortage.description}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              - R$ {shortage.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default CashierReports;
