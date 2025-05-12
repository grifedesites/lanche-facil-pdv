import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import AppShell from "@/components/Layout/AppShell";
import { useCashier } from "@/contexts/CashierContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Payment method types for reconciliation
const PaymentMethods = [
  { id: "cash", name: "Dinheiro" },
  { id: "credit_card", name: "Cartão de Crédito" },
  { id: "debit_card", name: "Cartão de Débito" },
  { id: "pix", name: "PIX" },
];

const CashierManagement: React.FC = () => {
  const { user, session, refreshSession } = useAuth();
  const { orders } = useOrders();
  const { 
    cashierOperations,
    registerCashierInflow,
    registerCashierOutflow,
    currentCashier,
    openCashier,
    closeCashier,
    cashierOpen
  } = useCashier();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [inflowDialogOpen, setInflowDialogOpen] = useState(false);
  const [outflowDialogOpen, setOutflowDialogOpen] = useState(false);
  const [openCashierDialog, setOpenCashierDialog] = useState(false);
  const [closeCashierDialog, setCloseCashierDialog] = useState(false);
  const [authErrorOpen, setAuthErrorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [inflow, setInflow] = useState({
    amount: "",
    description: "",
  });
  
  const [outflow, setOutflow] = useState({
    amount: "",
    description: "",
    category: "general",
  });
  
  const [initialAmount, setInitialAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Payment reconciliation
  const [reconciliation, setReconciliation] = useState<{
    cash: string;
    credit_card: string;
    debit_card: string;
    pix: string;
  }>({
    cash: "",
    credit_card: "",
    debit_card: "",
    pix: "",
  });
  
  // Calculate expected amounts based on completed orders for the day
  const calculateExpectedAmounts = () => {
    if (!currentCashier) return { total: 0, byMethod: {} };
    
    // Filter orders that were created after the cashier was opened
    const cashierOpenTime = new Date(currentCashier.openedAt || new Date()).getTime();
    const relevantOrders = orders.filter(order => 
      order.status === "completed" && 
      new Date(order.createdAt).getTime() >= cashierOpenTime
    );
    
    // Calculate totals by payment method
    const byMethod = relevantOrders.reduce((acc, order) => {
      const method = order.paymentMethod || "cash";
      acc[method] = (acc[method] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);
    
    // Total of all orders
    const total = relevantOrders.reduce((sum, order) => sum + order.total, 0);
    
    return { total, byMethod };
  };
  
  const expectedAmounts = calculateExpectedAmounts();
  
  // Verificar autenticação do Supabase
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error.message);
          setAuthErrorOpen(true);
          return;
        }
        
        // Se não tiver sessão mas tiver usuário local, tentar atualizar sessão
        if (!currentSession && user) {
          console.log("Tentando renovar sessão com Supabase");
          await refreshSession();
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        setAuthErrorOpen(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [user, refreshSession]);
  
  // Função para atualizar sessão manualmente
  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      toast.success("Sessão atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error);
      toast.error("Não foi possível atualizar a sessão");
      setAuthErrorOpen(true);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Função modificada para abrir o caixa com validação de UUID e sessão
  const handleOpenCashier = async () => {
    if (!initialAmount || parseFloat(initialAmount) <= 0) {
      toast.error("Informe um valor inicial válido.");
      return;
    }
    
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    // Verificar se temos sessão no Supabase
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      setAuthErrorOpen(true);
      return;
    }
    
    // Validar ID do usuário
    let userId = user.id;
    if (!userId || typeof userId !== 'string' || userId.length < 20) {
      // Gerar novo UUID válido e atualizar no localStorage
      userId = uuidv4();
      const updatedUser = { ...user, id: userId };
      localStorage.setItem("pdv-user", JSON.stringify(updatedUser));
      toast.info("Seu ID de usuário foi atualizado para um formato compatível");
    }
    
    try {
      await openCashier(userId, user.name, parseFloat(initialAmount));
      setOpenCashierDialog(false);
      setInitialAmount("");
      toast.success("Caixa aberto com sucesso!");
    } catch (error: any) {
      console.error("Erro ao abrir caixa:", error);
      
      // Verificar se é um erro de RLS
      if (error.message && error.message.includes("violates row-level security policy")) {
        setAuthErrorOpen(true);
      } else {
        toast.error(`Erro ao abrir o caixa: ${error.message || "Erro desconhecido"}`);
      }
    }
  };
  
  const handleCloseCashier = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    // Convert reconciliation values to numbers
    const reconciliationData = Object.entries(reconciliation).map(([method, amount]) => ({
      method,
      amount: amount ? parseFloat(amount) : 0
    })).filter(item => item.amount > 0);
    
    try {
      const result = await closeCashier(
        user.id, 
        user.name || user.username, 
        reconciliationData,
        adminPassword || undefined
      );
      
      if (result) {
        setCloseCashierDialog(false);
        setClosingNotes("");
        setAdminPassword("");
        setReconciliation({
          cash: "",
          credit_card: "",
          debit_card: "",
          pix: "",
        });
      }
    } catch (error) {
      toast.error("Erro ao fechar o caixa.");
    }
  };
  
  const handleInflow = () => {
    if (!inflow.amount || parseFloat(inflow.amount) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    
    try {
      registerCashierInflow(parseFloat(inflow.amount), inflow.description);
      setInflowDialogOpen(false);
      setInflow({ amount: "", description: "" });
    } catch (error) {
      toast.error("Erro ao registrar entrada.");
    }
  };
  
  const handleOutflow = () => {
    if (!outflow.amount || parseFloat(outflow.amount) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    
    try {
      registerCashierOutflow(parseFloat(outflow.amount), outflow.description, outflow.category);
      setOutflowDialogOpen(false);
      setOutflow({ amount: "", description: "", category: "general" });
    } catch (error) {
      toast.error("Erro ao registrar saída.");
    }
  };
  
  // Ensure cashierOperations is an array even if undefined
  const operations = cashierOperations || [];
  
  // Filtra as operações pela data selecionada
  const filteredOperations = date
    ? operations.filter(op => {
        const opDate = new Date(op.timestamp);
        return (
          opDate.getDate() === date.getDate() &&
          opDate.getMonth() === date.getMonth() &&
          opDate.getFullYear() === date.getFullYear()
        );
      })
    : operations;
  
  // Calcula o saldo do dia
  const dailyBalance = filteredOperations.reduce((acc, op) => {
    if (op.type === "inflow" || op.type === "opening" || op.type === "sale") return acc + op.amount;
    if (op.type === "outflow" || op.type === "closing") return acc - op.amount;
    if (op.type === "shortage") return acc - op.amount;
    return acc;
  }, 0);

  // Render badges for different operation types
  const renderOperationBadge = (type: string) => {
    switch (type) {
      case "opening":
        return <Badge className="bg-blue-500">Abertura</Badge>;
      case "closing":
        return <Badge variant="secondary">Fechamento</Badge>;
      case "inflow":
        return <Badge className="bg-green-500">Entrada</Badge>;
      case "outflow":
        return <Badge variant="destructive">Saída</Badge>;
      case "sale":
        return <Badge>Venda</Badge>;
      case "shortage":
        return <Badge className="bg-yellow-500 text-black">Quebra</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Determine text color for operation amounts
  const getOperationTextColor = (type: string) => {
    if (["inflow", "opening", "sale"].includes(type)) {
      return "text-green-600";
    } else if (["outflow", "shortage"].includes(type)) {
      return "text-red-600";
    }
    return "";
  };
  
  // Get sign for operation amount
  const getOperationSign = (type: string) => {
    return ["inflow", "opening", "sale"].includes(type) ? "+ " : "- ";
  };

  // Função auxiliar para formatação segura de valores
  const formatCurrencySafe = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return "0.00";
    }
    return value.toFixed(2);
  };

  return (
    <AppShell requireAdmin>
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <p>Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Gerenciamento de Caixa</h1>
            
            <div className="flex space-x-2 items-center">
              {!session && (
                <div className="text-yellow-500 text-sm flex items-center gap-1 mr-4">
                  <span className="rounded-full bg-yellow-100 p-1 w-2 h-2"></span>
                  Modo offline
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefreshSession}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      "Atualizando..."
                    ) : (
                      <>
                        <RefreshCcw className="mr-1 h-3 w-3" /> Reconectar
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {!cashierOpen ? (
                <Button onClick={() => setOpenCashierDialog(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Abrir Caixa
                </Button>
              ) : (
                <Button onClick={() => setCloseCashierDialog(true)} variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </Button>
              )}
            </div>
          </div>
          
          {/* Status do Caixa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status do Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {cashierOpen ? (
                      <Badge variant="default" className="bg-green-500">Aberto</Badge>
                    ) : (
                      <Badge variant="secondary">Fechado</Badge>
                    )}
                  </span>
                  {cashierOpen && currentCashier && (
                    <span className="text-sm text-muted-foreground">
                      Desde {format(new Date(currentCashier.openedAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {currentCashier && formatCurrencySafe(currentCashier.currentBalance || currentCashier.balance)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  dailyBalance > 0 ? "text-green-600" : dailyBalance < 0 ? "text-red-600" : ""
                )}>
                  R$ {dailyBalance.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Entradas e Saídas */}
          <div className="flex flex-col md:flex-row gap-6">
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Operações de Caixa</CardTitle>
                  <CardDescription>
                    Histórico de entradas e saídas
                  </CardDescription>
                </div>
                
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="ml-auto">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Button 
                    onClick={() => setInflowDialogOpen(true)}
                    disabled={!cashierOpen}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Nova Entrada
                  </Button>
                  <Button 
                    onClick={() => setOutflowDialogOpen(true)} 
                    variant="outline"
                    disabled={!cashierOpen}
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Nova Saída
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Operador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOperations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma operação encontrada para esta data.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOperations.map((operation) => (
                          <TableRow key={operation.id}>
                            <TableCell>
                              {format(new Date(operation.timestamp), 'HH:mm')}
                            </TableCell>
                            <TableCell>
                              {renderOperationBadge(operation.type)}
                            </TableCell>
                            <TableCell>{operation.description}</TableCell>
                            <TableCell className={cn(
                              "text-right font-medium",
                              getOperationTextColor(operation.type)
                            )}>
                              {getOperationSign(operation.type)}
                              R$ {operation.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {operation.operatorName || ''}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Diálogo para Abertura de Caixa */}
      <Dialog open={openCashierDialog} onOpenChange={setOpenCashierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogDescription>
              Informe o valor inicial do caixa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="initial-amount">Valor Inicial (R$)</Label>
              <Input
                id="initial-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCashierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCashier}>
              Confirmar Abertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Fechamento de Caixa */}
      <Dialog open={closeCashierDialog} onOpenChange={setCloseCashierDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
            <DialogDescription>
              Confirme os valores por forma de pagamento e o fechamento do caixa atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Saldo Atual</Label>
              <div className="text-lg font-semibold">
                R$ {currentCashier && formatCurrencySafe(currentCashier.currentBalance || currentCashier.balance)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                O valor total informado deve corresponder ao saldo atual do caixa.
                Valores inferiores gerarão um registro de quebra de caixa.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Valores por Forma de Pagamento</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {PaymentMethods.map((method) => {
                  const expectedAmount = expectedAmounts.byMethod[method.id] || 0;
                  
                  return (
                    <div key={method.id} className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor={`payment-${method.id}`}>{method.name}</Label>
                        {expectedAmount > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Esperado: R$ {expectedAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Input
                        id={`payment-${method.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={reconciliation[method.id as keyof typeof reconciliation]}
                        onChange={(e) => setReconciliation({
                          ...reconciliation,
                          [method.id]: e.target.value
                        })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha de Administrador</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Digite a senha de administrador"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="closing-notes">Observações (opcional)</Label>
              <Input
                id="closing-notes"
                placeholder="Notas sobre o fechamento do caixa"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseCashierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCashier}>
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Nova Entrada */}
      <Dialog open={inflowDialogOpen} onOpenChange={setInflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Entrada</DialogTitle>
            <DialogDescription>
              Registre uma entrada de dinheiro no caixa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inflow-amount">Valor (R$)</Label>
              <Input
                id="inflow-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={inflow.amount}
                onChange={(e) => setInflow({...inflow, amount: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inflow-description">Descrição</Label>
              <Input
                id="inflow-description"
                placeholder="Ex: Depósito, Recebimento, etc."
                value={inflow.description}
                onChange={(e) => setInflow({...inflow, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInflowDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInflow}>
              Registrar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Nova Saída */}
      <Dialog open={outflowDialogOpen} onOpenChange={setOutflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Saída</DialogTitle>
            <DialogDescription>
              Registre uma saída de dinheiro do caixa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="outflow-amount">Valor (R$)</Label>
              <Input
                id="outflow-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={outflow.amount}
                onChange={(e) => setOutflow({...outflow, amount: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outflow-category">Categoria</Label>
              <Select 
                value={outflow.category} 
                onValueChange={(value) => setOutflow({...outflow, category: value})}
              >
                <SelectTrigger id="outflow-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="withdrawal">Sangria</SelectItem>
                  <SelectItem value="expenses">Despesa</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outflow-description">Descrição</Label>
              <Input
                id="outflow-description"
                placeholder="Ex: Sangria, Pagamento, etc."
                value={outflow.description}
                onChange={(e) => setOutflow({...outflow, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutflowDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOutflow}>
              Registrar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Erro de Autenticação */}
      <AlertDialog open={authErrorOpen} onOpenChange={setAuthErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro de Autenticação</AlertDialogTitle>
            <AlertDialogDescription>
              Ocorreu um erro de autenticação com o servidor. Para continuar usando 
              todas as funcionalidades, é necessário fazer login novamente ou tentar 
              reconectar sua sessão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAuthErrorOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefreshSession}>Tentar Reconectar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default CashierManagement;
