
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    id: "1",
    name: "Administrador",
    username: "admin",
    password: "admin123",
    role: "admin"
  },
  "func1": {
    id: "2",
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
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem("pdv-user");
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Em produção, isso seria uma chamada API
    const user = MOCK_USERS[username];
    
    if (user && user.password === password) {
      const { password: _, ...userData } = user;
      setUser(userData);
      localStorage.setItem("pdv-user", JSON.stringify(userData));
      toast.success(`Bem-vindo, ${userData.name}!`);
      return true;
    }
    
    toast.error("Nome de usuário ou senha incorretos");
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pdv-user");
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
