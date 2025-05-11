
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
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  const navigate = useNavigate();

  // Verificar se há um usuário no localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("pdv-user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Garantir que o ID seja um UUID válido
        if (parsedUser && (!parsedUser.id || parsedUser.id.length < 10)) {
          parsedUser.id = uuidv4(); // Gera um novo UUID válido se não for válido
        }
        setUser(parsedUser);
        
        // Opcional: Verificar se já existe uma sessão do Supabase
        checkSupabaseSession();
      } catch (error) {
        localStorage.removeItem("pdv-user");
      }
    }
  }, []);
  
  // Verificar se existe uma sessão do Supabase
  const checkSupabaseSession = async () => {
    const { data } = await supabase.auth.getSession();
    // Se não houver sessão no Supabase, podemos tentar fazer login anônimo
    // ou apenas manter o fluxo baseado em localStorage como está
    console.log("Supabase session:", data);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    // Em produção, isso seria uma chamada API
    const user = MOCK_USERS[username];
    
    if (user && user.password === password) {
      const { password: _, ...userData } = user;
      
      // Garantir que o ID do usuário é um UUID válido
      if (!userData.id || userData.id.length < 10) {
        userData.id = uuidv4(); // Gerar um novo UUID válido
      }
      
      setUser(userData);
      localStorage.setItem("pdv-user", JSON.stringify(userData));
      
      // Para integração com Supabase, podemos fazer login anônimo ou com email/senha
      try {
        // Esta é uma abordagem opcional para manter a sessão no Supabase
        // para funcionar com as políticas RLS
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`, // Email fictício para teste
          password: password,
        });
        
        if (error) {
          // Se o login falhar, tentar criar o usuário
          console.warn("Erro ao fazer login no Supabase:", error.message);
          
          // Podemos tentar fazer login anônimo como fallback
          const { error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) {
            console.warn("Erro ao fazer login anônimo:", anonError.message);
          }
        } else {
          console.log("Login no Supabase bem-sucedido:", data);
        }
      } catch (error) {
        console.error("Erro na autenticação Supabase:", error);
      }
      
      toast.success(`Bem-vindo, ${userData.name}!`);
      return true;
    }
    
    toast.error("Nome de usuário ou senha incorretos");
    return false;
  };

  const logout = () => {
    setUser(null);
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
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin"
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
