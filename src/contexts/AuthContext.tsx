
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

// Tipos
export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: any | null; // Adicionado para expor a sessão do Supabase
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshSession: () => Promise<void>; // Adicionado para forçar renovação da sessão
}

// Usuários de exemplo (em produção, isso seria validado com um backend)
const MOCK_USERS: Record<string, User & { password: string }> = {
  "admin": {
    id: "75442486-0878-440c-9db1-a7006c25a39f", // UUID válido
    name: "Administrador",
    username: "admin",
    password: "admin123",
    role: "admin"
  },
  "func1": {
    id: "8a1456e8-6ef9-4ed9-8a01-24f34d5b5a39", // UUID válido
    name: "Funcionário 1",
    username: "func1",
    password: "func123",
    role: "employee"
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const navigate = useNavigate();

  // Verificar se há um usuário no localStorage e estabelecer sessão do Supabase
  useEffect(() => {
    const setupInitialAuth = async () => {
      try {
        // 1. Verificar se há sessão do Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erro ao obter sessão:", sessionError);
        }
        
        if (sessionData.session) {
          console.log("Sessão existente do Supabase:", sessionData.session);
          setSession(sessionData.session);
        }
        
        // 2. Verificar se há usuário no localStorage
        const storedUser = localStorage.getItem("pdv-user");
        
        if (storedUser) {
          try {
            let parsedUser = JSON.parse(storedUser);
            
            // Garantir que o ID seja um UUID válido
            if (!parsedUser.id || parsedUser.id.length < 20) {
              console.log("ID de usuário inválido, gerando novo UUID");
              parsedUser.id = uuidv4();
              localStorage.setItem("pdv-user", JSON.stringify(parsedUser));
            }
            
            setUser(parsedUser);
            
            // Se temos usuário local mas não temos sessão no Supabase, tentar autenticar
            if (!sessionData.session) {
              console.log("Tentando autenticar com Supabase para usuário local");
              await establishSupabaseSession(parsedUser);
            }
          } catch (error) {
            console.error("Erro ao processar usuário armazenado:", error);
            localStorage.removeItem("pdv-user");
            navigate("/login");
          }
        } else if (!sessionData.session) {
          // Não temos nem usuário local nem sessão do Supabase
          navigate("/login");
        }

        // Configurar listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log("Evento de autenticação:", event, newSession);
            setSession(newSession);
            
            // Se o usuário deslogar, redirecionar para login
            if (event === 'SIGNED_OUT') {
              setUser(null);
              localStorage.removeItem("pdv-user");
              navigate("/login");
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Erro durante setup inicial de autenticação:", error);
      }
    };
    
    setupInitialAuth();
  }, [navigate]);
  
  // Função para estabelecer uma sessão do Supabase
  const establishSupabaseSession = async (userData: User) => {
    try {
      // Verificar se já existe uma sessão
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Tentando login no Supabase para:", userData.username);
        
        // Estratégia 1: Tentar login com email/senha
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${userData.username}@example.com`,
            password: MOCK_USERS[userData.username]?.password || "senha123",
          });
          
          if (error) {
            throw error;
          }
          
          console.log("Login com email/senha bem-sucedido:", data);
          setSession(data.session);
          return;
        } catch (error: any) {
          console.warn("Erro ao fazer login com email/senha:", error.message);
        }
        
        // Estratégia 2: Tentar login anônimo ou criação de conta
        try {
          console.log("Tentando criar conta para usuário:", userData.username);
          const { data, error } = await supabase.auth.signUp({
            email: `${userData.username}@sistema-pdv.com`,
            password: `pdv_${uuidv4().substring(0, 8)}`,
            options: {
              data: {
                name: userData.name,
                role: userData.role
              }
            }
          });
          
          if (error) {
            throw error;
          }
          
          console.log("Criação de conta bem-sucedida:", data);
          setSession(data.session);
        } catch (signUpError: any) {
          console.error("Erro ao criar conta:", signUpError.message);
          // Exibir erro, mas não bloquear o fluxo
          toast.error("Erro de autenticação com o servidor. Continuando em modo local.");
        }
      } else {
        console.log("Sessão existente do Supabase encontrada");
        setSession(session);
      }
    } catch (error) {
      console.error("Erro ao estabelecer sessão Supabase:", error);
    }
  };

  // Nova função para forçar uma atualização da sessão
  const refreshSession = async () => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      // Forçar uma atualização da sessão
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        // Se falhar ao atualizar, tentar estabelecer uma nova sessão
        await establishSupabaseSession(user);
      } else {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error);
      toast.error("Erro ao atualizar sessão. Tente fazer login novamente.");
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    // Em produção, isso seria uma chamada API
    const user = MOCK_USERS[username];
    
    if (user && user.password === password) {
      const { password: _, ...userData } = user;
      
      // Garantir que o ID do usuário é um UUID válido
      if (!userData.id || userData.id.length < 20) {
        userData.id = uuidv4(); // Gerar um novo UUID válido
      }
      
      setUser(userData);
      localStorage.setItem("pdv-user", JSON.stringify(userData));
      
      // Estabelecer sessão no Supabase
      try {
        await establishSupabaseSession(userData);
        
        toast.success(`Bem-vindo, ${userData.name}!`);
        return true;
      } catch (error: any) {
        console.error("Erro na autenticação Supabase:", error);
        // Continuar mesmo com erro no Supabase, usando apenas autenticação local
        toast.warning("Autenticado localmente, algumas funções podem estar limitadas.");
        return true;
      }
    }
    
    toast.error("Nome de usuário ou senha incorretos");
    return false;
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("pdv-user");
    
    // Fazer logout do Supabase também
    supabase.auth.signOut().catch(error => {
      console.error("Erro ao fazer logout do Supabase:", error);
    });
    
    navigate("/login");
    toast.info("Você foi desconectado");
  };

  const value = {
    user,
    session,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
