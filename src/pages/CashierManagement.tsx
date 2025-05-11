
import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import AppShell from "@/components/Layout/AppShell";
import { useCashier } from "@/contexts/CashierContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Payment method types for reconciliation
const PaymentMethods = [
  { id: "cash", name: "Dinheiro" },
  { id: "credit_card", name: "Cartão de Crédito" },
  { id: "debit_card", name: "Cartão de Débito" },
  { id: "pix", name: "PIX" },
];

const CashierManagement: React.FC = () => {
  const { user } = useAuth();
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
  
  const handleOpenCashier = () => {
    if (!initialAmount || parseFloat(initialAmount) <= 0) {
      toast.error("Informe um valor inicial válido.");
      return;
    }
    
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    try {
      openCashier(user.id, user.name || user.username, parseFloat(initialAmount));
      setOpenCashierDialog(false);
      setInitialAmount("");
    } catch (error) {
      toast.error("Erro ao abrir o caixa.");
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

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gerenciamento de Caixa</h1>
          
          <div className="flex space-x-2">
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
                R$ {currentCashier?.currentBalance.toFixed(2) || '0.00'}
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
                R$ {currentCashier?.currentBalance.toFixed(2) || '0.00'}
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
    </AppShell>
  );
};

export default CashierManagement;
