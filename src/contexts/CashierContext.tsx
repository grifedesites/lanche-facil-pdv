import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SettingsRow, CashierReconciliationRow } from "@/integrations/supabase/client";

// Definição de tipos para operações de caixa
export interface CashFlow {
  id: string;
  type: "open" | "close" | "input" | "output";
  description: string;
  amount: number;
  timestamp: string;
  userName: string;
}

// Definição do tipo para o estado do caixa
export interface Cashier {
  id: string;
  isOpen: boolean;
  initialAmount: number;
  balance: number;
  openedAt: string | null;
  closedAt: string | null;
  openedBy: string | null;
  openedById: string | null;
  currentBalance?: number; // Adicionamos como opcional para compatibilidade
}

// Interface para as operações de caixa formatadas para o componente
export interface CashOperation {
  id: string;
  type: string; // "opening", "closing", "inflow", "outflow", "sale", "shortage"
  description: string;
  amount: number;
  timestamp: string;
  operatorName: string;
  category?: string;
}

// Tipo do contexto do caixa
export interface CashierContextType {
  cashState: Cashier;
  settings: SettingsRow[];
  reconciliations: CashierReconciliationRow[];
  cashFlows: CashFlow[];
  cashierOperations: CashOperation[]; // Adicionado para CashierManagement
  currentCashier: Cashier; // Alias para cashState
  cashierOpen: boolean; // Alias para cashState.isOpen
  fetchCashierState: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchReconciliations: () => Promise<void>;
  openCashier: (userId: string, userName: string, initialAmount: number) => Promise<void>;
  closeCashier: (userId: string, userName: string, reconciliationData?: Array<{method: string, amount: number}>, adminPassword?: string) => Promise<boolean>;
  updateSetting: (key: string, value: string) => Promise<void>;
  createReconciliation: (paymentMethod: string, reportedAmount: number) => Promise<void>;
  addCashInput: (userId: string, userName: string, amount: number, description: string) => Promise<void>;
  addCashOutput: (userId: string, userName: string, amount: number, description: string) => Promise<void>;
  registerCashierInflow: (amount: number, description: string) => Promise<void>; // Adicionado para CashierManagement
  registerCashierOutflow: (amount: number, description: string, category?: string) => Promise<void>; // Adicionado para CashierManagement
}

// Criação do contexto
const CashierContext = createContext<CashierContextType | undefined>(undefined);

// Provider do contexto
export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estado para o caixa
  const [cashState, setCashState] = useState<Cashier>({
    id: "",
    isOpen: false,
    initialAmount: 0,
    balance: 0,
    openedAt: null,
    closedAt: null,
    openedBy: null,
    openedById: null,
  });
  
  // Estados para configurações, reconciliações e fluxos de caixa
  const [settings, setSettings] = useState<SettingsRow[]>([]);
  const [reconciliations, setReconciliations] = useState<CashierReconciliationRow[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [cashierOperations, setCashierOperations] = useState<CashOperation[]>([]);
  
  const { user } = useAuth();

  // Função para buscar o estado do caixa
  const fetchCashierState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cashiers")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Mapeia os dados do Supabase para o tipo Cashier
        const typedCashier: Cashier = {
          id: data[0].id,
          isOpen: data[0].is_open,
          initialAmount: data[0].initial_balance,
          balance: data[0].current_balance,
          openedAt: data[0].opened_at,
          closedAt: data[0].closed_at,
          openedBy: data[0].opened_by_name,
          openedById: data[0].opened_by,
          currentBalance: data[0].current_balance, // Garantir que está mapeado
        };
        setCashState(typedCashier);
      } else {
        // Se não houver dados de caixa, define o estado com valores padrão
        setCashState({
          id: "",
          isOpen: false,
          initialAmount: 0,
          balance: 0,
          openedAt: null,
          closedAt: null,
          openedBy: null,
          openedById: null,
          currentBalance: 0, // Adicionar com valor padrão
        });
      }
      
      // Busca as operações de caixa
      await fetchCashOperations();
    } catch (error: any) {
      console.error("Error fetching cashier state:", error.message);
      toast.error("Erro ao carregar estado do caixa.");
    }
  }, []);

  // Função para buscar as operações de caixa (para CashierManagement)
  const fetchCashOperations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cashier_operations")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Mapeia os dados do Supabase para o tipo CashOperation
        const operations: CashOperation[] = data.map((op) => ({
          id: op.id,
          type: mapOperationType(op.type),
          description: op.description || "",
          amount: op.amount,
          timestamp: op.timestamp,
          operatorName: op.username,
          category: op.category,
        }));
        
        setCashierOperations(operations);
        
        // Também atualiza os fluxos de caixa tradicionais
        const flows: CashFlow[] = data.map((op) => ({
          id: op.id,
          type: op.type as "open" | "close" | "input" | "output",
          description: op.description || "",
          amount: op.amount,
          timestamp: op.timestamp,
          userName: op.username,
        }));
        setCashFlows(flows);
      }
    } catch (error: any) {
      console.error("Error fetching cash operations:", error.message);
      toast.error("Erro ao carregar operações de caixa.");
    }
  }, []);

  // Função para mapear os tipos de operação para formato mais amigável
  const mapOperationType = (type: string): string => {
    switch (type) {
      case "open":
        return "opening";
      case "close":
        return "closing";
      case "input":
        return "inflow";
      case "output":
        return "outflow";
      default:
        return type;
    }
  };

  // Função para buscar as configurações
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .order("key", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error.message);
      toast.error("Erro ao carregar configurações.");
    }
  }, []);

  // Função para buscar as reconciliações de caixa
  const fetchReconciliations = useCallback(async () => {
    try {
      if (!cashState.id) {
        setReconciliations([]);
        return;
      }

      const { data, error } = await supabase
        .from("cashier_reconciliation")
        .select("*")
        .eq("cashier_id", cashState.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setReconciliations(data);
      }
    } catch (error: any) {
      console.error("Error fetching reconciliations:", error.message);
      toast.error("Erro ao carregar conciliações de caixa.");
    }
  }, [cashState.id]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchCashierState();
    fetchSettings();
  }, [fetchCashierState, fetchSettings]);

  // Efeito para carregar reconciliações quando o ID do caixa mudar
  useEffect(() => {
    if (cashState.id) {
      fetchReconciliations();
    }
  }, [cashState.id, fetchReconciliations]);

  // Função para abrir o caixa
  const openCashier = async (userId: string, userName: string, initialAmount: number) => {
    try {
      const cashierId = uuidv4();
      
      // Insere o novo registro de caixa
      const { error: cashierError } = await supabase
        .from("cashiers")
        .insert([
          {
            id: cashierId,
            is_open: true,
            initial_balance: initialAmount,
            current_balance: initialAmount,
            opened_at: new Date().toISOString(),
            opened_by: userId,
            opened_by_name: userName,
          },
        ]);

      if (cashierError) {
        throw cashierError;
      }

      // Registra a operação de abertura
      const { error: operationError } = await supabase
        .from("cashier_operations")
        .insert([
          {
            id: uuidv4(),
            type: "open",
            description: "Abertura de caixa",
            amount: initialAmount,
            timestamp: new Date().toISOString(),
            user_id: userId,
            username: userName,
          },
        ]);

      if (operationError) {
        throw operationError;
      }

      // Atualiza o estado local
      setCashState({
        id: cashierId,
        isOpen: true,
        initialAmount: initialAmount,
        balance: initialAmount,
        openedAt: new Date().toISOString(),
        closedAt: null,
        openedBy: userName,
        openedById: userId,
        currentBalance: initialAmount,
      });

      toast.success("Caixa aberto com sucesso!");
      await fetchCashierState();  // Atualiza o estado
    } catch (error: any) {
      console.error("Error opening cashier:", error.message);
      toast.error("Erro ao abrir caixa: " + error.message);
    }
  };

  // Função para fechar o caixa
  const closeCashier = async (userId: string, userName: string, reconciliationData?: Array<{method: string, amount: number}>, adminPassword?: string): Promise<boolean> => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return false;
    }

    try {
      // Atualiza o registro do caixa
      const { error: cashierError } = await supabase
        .from("cashiers")
        .update({
          is_open: false,
          closed_at: new Date().toISOString(),
          closed_by: userId,
          closed_by_name: userName,
          closing_balance: cashState.balance,
          notes: adminPassword ? "Fechado com senha de administrador" : undefined,
        })
        .eq("id", cashState.id);

      if (cashierError) {
        throw cashierError;
      }

      // Registra a operação de fechamento
      const { error: operationError } = await supabase
        .from("cashier_operations")
        .insert([
          {
            id: uuidv4(),
            type: "close",
            description: "Fechamento de caixa",
            amount: cashState.balance,
            timestamp: new Date().toISOString(),
            user_id: userId,
            username: userName,
          },
        ]);

      if (operationError) {
        throw operationError;
      }

      // Se reconciliationData foi fornecido, registra a conciliação
      if (reconciliationData && reconciliationData.length > 0) {
        for (const item of reconciliationData) {
          await createReconciliation(item.method, item.amount);
        }
      }

      // Atualiza o estado local
      setCashState({
        ...cashState,
        isOpen: false,
        closedAt: new Date().toISOString(),
      });

      toast.success("Caixa fechado com sucesso!");
      await fetchCashierState();  // Atualiza o estado
      return true;
    } catch (error: any) {
      console.error("Error closing cashier:", error.message);
      toast.error("Erro ao fechar caixa.");
      return false;
    }
  };

  // Função para atualizar uma configuração
  const updateSetting = async (key: string, value: string) => {
    try {
      const settingToUpdate = settings.find((setting) => setting.key === key);

      if (!settingToUpdate) {
        toast.error("Configuração não encontrada.");
        return;
      }

      const { error } = await supabase
        .from("settings")
        .update({ value })
        .eq("id", settingToUpdate.id);

      if (error) {
        throw error;
      }

      const updatedSettings = settings.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      );
      setSettings(updatedSettings);
      toast.success("Configuração atualizada com sucesso!");
      await fetchSettings(); // Atualiza as configurações
    } catch (error: any) {
      console.error("Error updating setting:", error.message);
      toast.error("Erro ao atualizar configuração.");
    }
  };

  // Função para criar uma reconciliação
  const createReconciliation = async (paymentMethod: string, reportedAmount: number) => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return;
    }

    try {
      const { error } = await supabase
        .from("cashier_reconciliation")
        .insert([
          {
            id: uuidv4(),
            cashier_id: cashState.id,
            payment_method: paymentMethod,
            reported_amount: reportedAmount,
            user_id: user?.id || null,
          },
        ]);

      if (error) {
        throw error;
      }

      toast.success("Conciliação de caixa criada com sucesso!");
      await fetchReconciliations(); // Atualiza as reconciliações
    } catch (error: any) {
      console.error("Error creating reconciliation:", error.message);
      toast.error("Erro ao criar conciliação de caixa.");
    }
  };

  // Função para adicionar entrada de caixa (suprimento)
  const addCashInput = async (userId: string, userName: string, amount: number, description: string) => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return;
    }

    try {
      // Atualiza o saldo do caixa
      const { error: updateError } = await supabase
        .from("cashiers")
        .update({
          current_balance: cashState.balance + amount,
        })
        .eq("id", cashState.id);

      if (updateError) {
        throw updateError;
      }

      // Registra a operação
      const { error: operationError } = await supabase
        .from("cashier_operations")
        .insert([
          {
            id: uuidv4(),
            type: "input",
            description: description || "Suprimento de caixa",
            amount: amount,
            timestamp: new Date().toISOString(),
            user_id: userId,
            username: userName,
          },
        ]);

      if (operationError) {
        throw operationError;
      }

      // Atualiza o estado local
      setCashState({
        ...cashState,
        balance: cashState.balance + amount,
      });

      toast.success("Entrada registrada com sucesso!");
      await fetchCashierState();  // Atualiza o estado
    } catch (error: any) {
      console.error("Error adding cash input:", error.message);
      toast.error("Erro ao registrar entrada de caixa.");
    }
  };

  // Função para adicionar saída de caixa (sangria)
  const addCashOutput = async (userId: string, userName: string, amount: number, description: string) => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return;
    }

    if (amount > cashState.balance) {
      toast.error("Saldo insuficiente para realizar sangria.");
      return;
    }

    try {
      // Atualiza o saldo do caixa
      const { error: updateError } = await supabase
        .from("cashiers")
        .update({
          current_balance: cashState.balance - amount,
        })
        .eq("id", cashState.id);

      if (updateError) {
        throw updateError;
      }

      // Registra a operação
      const { error: operationError } = await supabase
        .from("cashier_operations")
        .insert([
          {
            id: uuidv4(),
            type: "output",
            description: description || "Sangria de caixa",
            amount: amount,
            timestamp: new Date().toISOString(),
            user_id: userId,
            username: userName,
          },
        ]);

      if (operationError) {
        throw operationError;
      }

      // Atualiza o estado local
      setCashState({
        ...cashState,
        balance: cashState.balance - amount,
      });

      toast.success("Sangria registrada com sucesso!");
      await fetchCashierState();  // Atualiza o estado
    } catch (error: any) {
      console.error("Error adding cash output:", error.message);
      toast.error("Erro ao registrar sangria de caixa.");
    }
  };

  // Funções de conveniência para CashierManagement
  const registerCashierInflow = async (amount: number, description: string) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    await addCashInput(user.id, user.name, amount, description);
  };
  
  const registerCashierOutflow = async (amount: number, description: string, category?: string) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    await addCashOutput(user.id, user.name, amount, description);
  };

  // Fornece o contexto
  const value: CashierContextType = {
    cashState,
    settings,
    reconciliations,
    cashFlows,
    cashierOperations,
    currentCashier: cashState, // Alias para compatibilidade com CashierManagement
    cashierOpen: cashState.isOpen, // Alias para compatibilidade com CashierManagement
    fetchCashierState,
    fetchSettings,
    fetchReconciliations,
    openCashier,
    closeCashier,
    updateSetting,
    createReconciliation,
    addCashInput,
    addCashOutput,
    registerCashierInflow,
    registerCashierOutflow,
  };

  return (
    <CashierContext.Provider value={value}>{children}</CashierContext.Provider>
  );
};

// Hook para usar o contexto
export const useCashier = (): CashierContextType => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error("useCashier must be used within a CashierProvider");
  }
  return context;
};
