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

// Define the types
export interface Cashier {
  id: string;
  isOpen: boolean;
  openingBalance: number;
  closingBalance: number | null;
  openedAt: string;
  closedAt: string | null;
  userId: string | null;
  userName: string | null;
}

export interface CashierContextType {
  cashState: Cashier;
  settings: SettingsRow[];
  reconciliations: CashierReconciliationRow[];
  fetchCashierState: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchReconciliations: () => Promise<void>;
  openCashier: (openingBalance: number) => Promise<void>;
  closeCashier: (closingBalance: number) => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  createReconciliation: (paymentMethod: string, reportedAmount: number) => Promise<void>;
}

// Create the context
const CashierContext = createContext<CashierContextType | undefined>(undefined);

// Create the provider
export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cashState, setCashState] = useState<Cashier>({
    id: "",
    isOpen: false,
    openingBalance: 0,
    closingBalance: null,
    openedAt: "",
    closedAt: null,
    userId: null,
    userName: null,
  });
  const [settings, setSettings] = useState<SettingsRow[]>([]);
  const [reconciliations, setReconciliations] = useState<CashierReconciliationRow[]>([]);
  const { user } = useAuth();

  // Function to fetch cashier state from Supabase
  const fetchCashierState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cashiers")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Map the Supabase data to the Cashier type
        const typedCashier: Cashier = {
          id: data.id,
          isOpen: data.is_open,
          openingBalance: data.opening_balance,
          closingBalance: data.closing_balance,
          openedAt: data.opened_at,
          closedAt: data.closed_at,
          userId: data.user_id,
          userName: data.username,
        };
        setCashState(typedCashier);
      } else {
        // If there's no cashier data, set the state to default values
        setCashState({
          id: "",
          isOpen: false,
          openingBalance: 0,
          closingBalance: null,
          openedAt: "",
          closedAt: null,
          userId: null,
          userName: null,
        });
      }
    } catch (error: any) {
      console.error("Error fetching cashier state:", error.message);
      toast.error("Erro ao carregar estado do caixa.");
    }
  }, []);

  // Function to fetch settings from Supabase
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
        // Map the Supabase data to the Settings type
        const typedSettings: SettingsRow[] = data.map((setting) => ({
          id: setting.id,
          key: setting.key,
          value: setting.value,
          description: setting.description,
          created_at: setting.created_at,
          updated_at: setting.updated_at,
        }));
        setSettings(typedSettings);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error.message);
      toast.error("Erro ao carregar configurações.");
    }
  }, []);

  // Function to fetch reconciliations from Supabase
  const fetchReconciliations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cashier_reconciliations")
        .select("*")
        .eq("cashier_id", cashState.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Map the Supabase data to the CashierReconciliation type
        const typedReconciliations: CashierReconciliationRow[] = data.map((reconciliation) => ({
          id: reconciliation.id,
          cashier_id: reconciliation.cashier_id,
          payment_method: reconciliation.payment_method,
          reported_amount: reconciliation.reported_amount,
          user_id: reconciliation.user_id,
          created_at: reconciliation.created_at,
        }));
        setReconciliations(typedReconciliations);
      }
    } catch (error: any) {
      console.error("Error fetching reconciliations:", error.message);
      toast.error("Erro ao carregar conciliações de caixa.");
    }
  }, [cashState.id]);

  useEffect(() => {
    fetchCashierState();
    fetchSettings();
  }, [fetchCashierState, fetchSettings]);

  useEffect(() => {
    if (cashState.id) {
      fetchReconciliations();
    }
  }, [cashState.id, fetchReconciliations]);

  // Function to open the cashier
  const openCashier = async (openingBalance: number) => {
    try {
      const { data, error } = await supabase.from("cashiers").insert([
        {
          id: uuidv4(),
          is_open: true,
          opening_balance: openingBalance,
          closing_balance: null,
          opened_at: new Date().toISOString(),
          closed_at: null,
          user_id: user?.id || null,
          username: user?.name || user?.username || null,
        },
      ]).select().single();

      if (error) {
        throw error;
      }

      if (data) {
        // Map the Supabase data to the Cashier type
        const typedCashier: Cashier = {
          id: data.id,
          isOpen: data.is_open,
          openingBalance: data.opening_balance,
          closingBalance: data.closing_balance,
          openedAt: data.opened_at,
          closedAt: data.closed_at,
          userId: data.user_id,
          userName: data.username,
        };
        setCashState(typedCashier);
        toast.success("Caixa aberto com sucesso!");
        await fetchCashierState(); // Refresh cashier state after opening
      }
    } catch (error: any) {
      console.error("Error opening cashier:", error.message);
      toast.error("Erro ao abrir caixa.");
    }
  };

  // Function to close the cashier
  const closeCashier = async (closingBalance: number) => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return;
    }

    try {
      const { error } = await supabase
        .from("cashiers")
        .update({
          is_open: false,
          closing_balance: closingBalance,
          closed_at: new Date().toISOString(),
        })
        .eq("id", cashState.id);

      if (error) {
        throw error;
      }

      setCashState({
        ...cashState,
        isOpen: false,
        closingBalance: closingBalance,
        closedAt: new Date().toISOString(),
      });
      toast.success("Caixa fechado com sucesso!");
      await fetchCashierState(); // Refresh cashier state after closing
    } catch (error: any) {
      console.error("Error closing cashier:", error.message);
      toast.error("Erro ao fechar caixa.");
    }
  };

  // Function to update a setting
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
      await fetchSettings(); // Refresh settings after updating
    } catch (error: any) {
      console.error("Error updating setting:", error.message);
      toast.error("Erro ao atualizar configuração.");
    }
  };

  // Function to create a reconciliation
  const createReconciliation = async (paymentMethod: string, reportedAmount: number) => {
    if (!cashState.id) {
      toast.error("Não há caixa aberto.");
      return;
    }

    try {
      const { error } = await supabase.from("cashier_reconciliations").insert([
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
      await fetchReconciliations(); // Refresh reconciliations after creating a new one
    } catch (error: any) {
      console.error("Error creating reconciliation:", error.message);
      toast.error("Erro ao criar conciliação de caixa.");
    }
  };

  // Provide the context value
  const value: CashierContextType = {
    cashState,
    settings,
    reconciliations,
    fetchCashierState,
    fetchSettings,
    fetchReconciliations,
    openCashier,
    closeCashier,
    updateSetting,
    createReconciliation,
  };

  return (
    <CashierContext.Provider value={value}>{children}</CashierContext.Provider>
  );
};

// Create the hook
export const useCashier = (): CashierContextType => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error("useCashier must be used within a CashierProvider");
  }
  return context;
};
