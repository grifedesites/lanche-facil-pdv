import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/Layout/AppShell";
import { useCashier } from "@/contexts/CashierContext";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { DollarSign, LogOut, Plus, Minus } from "lucide-react";

const Cashier: React.FC = () => {
  const { cashState, cashFlows, openCashier, closeCashier, addCashInput, addCashOutput } = useCashier();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isOpenCashierDialog, setIsOpenCashierDialog] = useState(false);
  const [isCloseCashierDialog, setIsCloseCashierDialog] = useState(false);
  const [isCashInputDialog, setIsCashInputDialog] = useState(false);
  const [isCashOutputDialog, setIsCashOutputDialog] = useState(false);
  
  const [initialAmount, setInitialAmount] = useState(0);
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutputAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado de autenticação do Supabase
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Verificar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error.message);
          return;
        }
        
        setSupabaseSession(session);
        console.log("Sessão do Supabase:", session);
        
        // Se não tiver sessão mas tiver usuário local, tentar autenticar
        if (!session && user) {
          console.log("Usuário local existe, mas não está autenticado no Supabase");
          
          // Tentar criar um usuário anônimo
          const { data, error } = await supabase.auth.signUp({
            email: `${user.username}_${Date.now()}@anonymous.com`,
            password: `anon_${uuidv4().substring(0, 8)}`,
            options: {
              data: {
                name: user.name,
                role: user.role
              }
            }
          });
          
          if (error) {
            console.error("Erro ao criar usuário anônimo:", error.message);
            
            // Se falhar, tentar login simples
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: `${user.username}@example.com`,
              password: "senha123", // Senha padrão para teste
            });
            
            if (signInError) {
              console.error("Também não foi possível fazer login:", signInError.message);
            } else {
              setSupabaseSession(signInData.session);
            }
          } else {
            setSupabaseSession(data.session);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [user]);

  // Garantir que o usuário está autenticado
  useEffect(() => {
    if (!user) {
      toast.error("É necessário estar autenticado para acessar o caixa");
      navigate("/login");
    }
  }, [user, navigate]);

  // Filtrar os movimentos do dia atual
  const todayFlows = cashFlows.filter(flow => {
    if (!flow.timestamp) return false;
    
    const flowDate = new Date(flow.timestamp);
    const today = new Date();
    return (
      flowDate.getDate() === today.getDate() &&
      flowDate.getMonth() === today.getMonth() &&
      flowDate.getFullYear() === today.getFullYear()
    );
  });

  // Função para validar UUID
  const isValidUUID = (id: string) => {
    if (!id) return false;
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(id);
  };

  const handleOpenCashier = async () => {
    if (!user) {
      toast.error("É necessário estar logado para abrir o caixa!");
      return;
    }
    
    if (initialAmount <= 0) {
      toast.error("Informe um valor inicial válido para o caixa!");
      return;
    }
    
    // Verificar se temos uma sessão válida no Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Erro de autenticação com o servidor. Tente fazer login novamente.");
      return;
    }
    
    // Validar o ID do usuário
    let userId = user.id;
    if (!isValidUUID(userId)) {
      // Gerar novo UUID e atualizar o localStorage
      userId = uuidv4();
      const updatedUser = { ...user, id: userId };
      localStorage.setItem("pdv-user", JSON.stringify(updatedUser));
      toast.info("Seu ID de usuário foi atualizado para um formato compatível");
    }
    
    try {
      await openCashier(userId, user.name, initialAmount);
      setIsOpenCashierDialog(false);
      setInitialAmount(0);
    } catch (err: any) {
      console.error("Erro detalhado ao abrir caixa:", err);
      toast.error(`Erro ao abrir caixa: ${err.message || "Erro desconhecido"}`);
    }
  };

  const handleCloseCashier = () => {
    if (!user) {
      toast.error("É necessário estar logado para fechar o caixa!");
      return;
    }
    
    closeCashier(user.id, user.name);
    setIsCloseCashierDialog(false);
  };

  const handleCashInput = () => {
    if (!user) return;
    
    if (inputAmount <= 0) {
      toast.error("Informe um valor válido para entrada de caixa!");
      return;
    }
    
    addCashInput(user.id, user.name, inputAmount, description);
    setIsCashInputDialog(false);
    setInputAmount(0);
    setDescription("");
  };

  const handleCashOutput = () => {
    if (!user) return;
    
    if (outputAmount <= 0) {
      toast.error("Informe um valor válido para sangria de caixa!");
      return;
    }
    
    if (description.trim() === "") {
      toast.error("Informe uma descrição para a sangria!");
      return;
    }
    
    addCashOutput(user.id, user.name, outputAmount, description);
    setIsCashOutputDialog(false);
    setOutputAmount(0);
    setDescription("");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <AppShell>
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <p>Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gerenciamento de Caixa</h1>
            
            <div className="flex items-center gap-4">
              {!supabaseSession && (
                <div className="text-yellow-500 text-sm flex items-center gap-1">
                  <span className="rounded-full bg-yellow-100 p-1 w-2 h-2"></span>
                  Modo offline
                </div>
              )}
              
              {cashState.isOpen ? (
                <div className="flex gap-2">
                  <Button onClick={() => setIsCashInputDialog(true)} variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" /> Suprimento
                  </Button>
                  <Button onClick={() => setIsCashOutputDialog(true)} variant="outline" className="gap-1">
                    <Minus className="h-4 w-4" /> Sangria
                  </Button>
                  <Button onClick={() => setIsCloseCashierDialog(true)} variant="destructive" className="gap-1">
                    <LogOut className="h-4 w-4" /> Fechar Caixa
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsOpenCashierDialog(true)} className="gap-1">
                  <DollarSign className="h-4 w-4" /> Abrir Caixa
                </Button>
              )}
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Caixa</CardTitle>
              <CardDescription>
                {cashState.isOpen 
                  ? `Aberto por ${cashState.openedBy || 'Usuário'} em ${cashState.openedAt ? formatDateTime(cashState.openedAt) : '-'}`
                  : "Caixa fechado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(cashState.balance)}
              </div>
              {cashState.isOpen && (
                <p className="text-sm text-muted-foreground">
                  Fundo inicial: {formatCurrency(cashState.initialAmount)}
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              {cashState.isOpen ? (
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => navigate("/pos")}
                >
                  Ir para o PDV
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsOpenCashierDialog(true)}
                >
                  Abrir Caixa
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Movimentações do Caixa</CardTitle>
              <CardDescription>
                Registros de aberturas, fechamentos, sangrias e suprimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayFlows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação registrada hoje.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayFlows.map((flow) => {
                      let typeLabel = "";
                      let valueClass = "";
                      
                      switch (flow.type) {
                        case "open":
                          typeLabel = "Abertura";
                          valueClass = "text-blue-600";
                          break;
                        case "close":
                          typeLabel = "Fechamento";
                          valueClass = "text-orange-600";
                          break;
                        case "input":
                          typeLabel = "Suprimento";
                          valueClass = "text-green-600";
                          break;
                        case "output":
                          typeLabel = "Sangria";
                          valueClass = "text-red-600";
                          break;
                      }

                      return (
                        <TableRow key={flow.id}>
                          <TableCell>{typeLabel}</TableCell>
                          <TableCell>{flow.description}</TableCell>
                          <TableCell className={valueClass}>
                            {formatCurrency(flow.amount)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(flow.timestamp), "HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{flow.userName}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Diálogo para Abertura de Caixa */}
      <Dialog open={isOpenCashierDialog} onOpenChange={setIsOpenCashierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abertura de Caixa</DialogTitle>
            <DialogDescription>
              Informe o valor inicial do fundo de caixa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="initial-amount">Valor Inicial (R$)</Label>
              <Input 
                id="initial-amount" 
                type="number" 
                step="0.01"
                min="0"
                value={initialAmount} 
                onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenCashierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCashier}>
              Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Fechamento de Caixa */}
      <Dialog open={isCloseCashierDialog} onOpenChange={setIsCloseCashierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechamento de Caixa</DialogTitle>
            <DialogDescription>
              Você está prestes a fechar o caixa atual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Valor inicial:</span>
                <span>{formatCurrency(cashState.initialAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Saldo atual:</span>
                <span>{formatCurrency(cashState.balance)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Diferença:</span>
                <span className={cashState.balance - cashState.initialAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(cashState.balance - cashState.initialAmount)}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseCashierDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCloseCashier}>
              Fechar Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Entrada de Caixa (Suprimento) */}
      <Dialog open={isCashInputDialog} onOpenChange={setIsCashInputDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suprimento de Caixa</DialogTitle>
            <DialogDescription>
              Adicionar dinheiro ao caixa (suprimento).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-amount">Valor (R$)</Label>
              <Input 
                id="input-amount" 
                type="number" 
                step="0.01"
                min="0"
                value={inputAmount} 
                onChange={(e) => setInputAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="input-description">Descrição</Label>
              <Input 
                id="input-description" 
                placeholder="Motivo do suprimento" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCashInputDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCashInput}>
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Saída de Caixa (Sangria) */}
      <Dialog open={isCashOutputDialog} onOpenChange={setIsCashOutputDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sangria de Caixa</DialogTitle>
            <DialogDescription>
              Retirar dinheiro do caixa (sangria).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-amount">Valor (R$)</Label>
              <Input 
                id="output-amount" 
                type="number" 
                step="0.01"
                min="0"
                max={cashState.balance}
                value={outputAmount} 
                onChange={(e) => setOutputAmount(parseFloat(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Saldo disponível: {formatCurrency(cashState.balance)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="output-description">Descrição</Label>
              <Textarea 
                id="output-description" 
                placeholder="Motivo da sangria" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCashOutputDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCashOutput}
              variant="destructive"
              disabled={outputAmount <= 0 || outputAmount > cashState.balance}
            >
              Confirmar Sangria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Cashier;
