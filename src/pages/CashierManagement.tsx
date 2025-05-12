import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCashier } from "@/contexts/CashierContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { AuthErrorDialog } from "@/components/AuthErrorDialog";
import { CashierStatusWidget } from "@/components/CashierStatusWidget";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CashierManagement = () => {
  const {
    cashState,
    cashierOpen,
    openCashier,
    closeCashier,
    addCashInput,
    addCashOutput,
    cashFlows,
  } = useCashier();
  const { user } = useAuth();
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [inputAmount, setInputAmount] = useState<number>(0);
  const [outputAmount, setOutputAmount] = useState<number>(0);
  const [inputDescription, setInputDescription] = useState<string>("");
  const [outputDescription, setOutputDescription] = useState<string>("");
  const [isClosingCashier, setIsClosingCashier] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [showCloseCashierDialog, setShowCloseCashierDialog] = useState(false);
  const { lastAuthError, refreshSession } = useAuth();
  const [showAuthError, setShowAuthError] = useState(false);

  useEffect(() => {
    if (lastAuthError && lastAuthError.includes("Erro de autenticação com o servidor")) {
      setShowAuthError(true);
    }
  }, [lastAuthError]);

  const handleOpenCashier = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (initialAmount <= 0) {
      toast.error("O valor inicial deve ser maior que zero.");
      return;
    }

    await openCashier(user.id, user.name, initialAmount);
    setInitialAmount(0);
  };

  const handleCloseCashier = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    setIsClosingCashier(true);
    try {
      await closeCashier(user.id, user.name, [], adminPassword);
      setAdminPassword("");
      setShowCloseCashierDialog(false);
    } finally {
      setIsClosingCashier(false);
    }
  };

  const handleAddCashInput = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (inputAmount <= 0) {
      toast.error("O valor de entrada deve ser maior que zero.");
      return;
    }

    await addCashInput(user.id, user.name, inputAmount, inputDescription);
    setInputAmount(0);
    setInputDescription("");
  };

  const handleAddCashOutput = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (outputAmount <= 0) {
      toast.error("O valor de saída deve ser maior que zero.");
      return;
    }

    await addCashOutput(user.id, user.name, outputAmount, outputDescription);
    setOutputAmount(0);
    setOutputDescription("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Caixa</h1>
        <CashierStatusWidget />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Estado do Caixa</CardTitle>
          <CardDescription>Informações sobre o estado atual do caixa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Label>Status:</Label>
              <span>{cashierOpen ? "Aberto" : "Fechado"}</span>
            </div>
            {cashierOpen && (
              <>
                <div className="flex items-center space-x-2">
                  <Label>Saldo Inicial:</Label>
                  <span>R$ {cashState?.initialAmount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Saldo Atual:</Label>
                  <span>R$ {cashState?.balance?.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Aberto por:</Label>
                  <span>{cashState?.openedBy}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Aberto em:</Label>
                  <span>
                    {cashState?.openedAt
                      ? format(new Date(cashState.openedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {!cashierOpen ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Abrir Caixa</CardTitle>
            <CardDescription>Defina o valor inicial para abrir o caixa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialAmount">Valor Inicial</Label>
                <Input
                  id="initialAmount"
                  type="number"
                  placeholder="Digite o valor inicial"
                  value={initialAmount.toString()}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleOpenCashier}>Abrir Caixa</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Fechar Caixa</CardTitle>
            <CardDescription>Feche o caixa e registre o valor final.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <p>Deseja fechar o caixa atual?</p>
              <Button onClick={() => setShowCloseCashierDialog(true)} disabled={isClosingCashier}>
                {isClosingCashier ? "Fechando..." : "Fechar Caixa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {cashierOpen && (
        <>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Entrada de Caixa</CardTitle>
              <CardDescription>Adicione um valor ao caixa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inputAmount">Valor de Entrada</Label>
                  <Input
                    id="inputAmount"
                    type="number"
                    placeholder="Digite o valor de entrada"
                    value={inputAmount.toString()}
                    onChange={(e) => setInputAmount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inputDescription">Descrição</Label>
                  <Input
                    id="inputDescription"
                    type="text"
                    placeholder="Digite a descrição"
                    value={inputDescription}
                    onChange={(e) => setInputDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddCashInput}>Adicionar Entrada</Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Saída de Caixa</CardTitle>
              <CardDescription>Retire um valor do caixa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outputAmount">Valor de Saída</Label>
                  <Input
                    id="outputAmount"
                    type="number"
                    placeholder="Digite o valor de saída"
                    value={outputAmount.toString()}
                    onChange={(e) => setOutputAmount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outputDescription">Descrição</Label>
                  <Input
                    id="outputDescription"
                    type="text"
                    placeholder="Digite a descrição"
                    value={outputDescription}
                    onChange={(e) => setOutputDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddCashOutput}>Adicionar Saída</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Separator className="my-6" />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Histórico de entradas e saídas de caixa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>{flow.type === 'input' ? 'Entrada' : flow.type === 'output' ? 'Saída' : flow.type === 'open' ? 'Abertura' : 'Fechamento'}</TableCell>
                  <TableCell>{flow.description}</TableCell>
                  <TableCell>R$ {flow.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(flow.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showCloseCashierDialog} onOpenChange={setShowCloseCashierDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja fechar o caixa? Esta ação é irreversível.
              <div className="mt-4">
                <Label htmlFor="adminPassword">Senha de Administrador (opcional)</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Digite a senha de administrador"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCloseCashierDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseCashier} disabled={isClosingCashier}>
              {isClosingCashier ? "Fechando..." : "Fechar Caixa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuthErrorDialog
        open={showAuthError}
        setOpen={setShowAuthError}
        message="Erro de autenticação com o servidor. Você pode tentar reconectar ou continuar em modo local."
      />
    </div>
  );
};

export default CashierManagement;
