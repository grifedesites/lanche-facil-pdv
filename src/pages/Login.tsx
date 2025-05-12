
import React, { useState, FormEvent, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn, Loader, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
  const { login, isAuthenticated, isAdmin, session, refreshSession } = useAuth();
  const navigate = useNavigate();

  // Verificar autenticação existente
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Verificar se há uma sessão ativa no Supabase
        const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão do Supabase:", error);
          setConnectionError(true);
        }
        
        // Log para debug
        console.log("Verificação de sessão inicial:", { 
          supabaseSession: !!supabaseSession,
          isAuthenticated,
          localUser: localStorage.getItem("pdv-user") 
        });
        
        // Tentar atualizar a sessão se tivermos um usuário local mas o Supabase não tiver sessão
        if (!supabaseSession && localStorage.getItem("pdv-user")) {
          try {
            await refreshSession();
          } catch (refreshError) {
            console.error("Não foi possível atualizar a sessão:", refreshError);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setConnectionError(true);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkExistingAuth();
  }, [isAuthenticated, refreshSession]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/dashboard" : "/pos"} />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate(isAdmin ? "/dashboard" : "/pos");
      }
    } catch (error) {
      console.error("Erro durante login:", error);
      toast.error("Erro ao processar login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Lanchonete PDV</CardTitle>
            <CardDescription>Faça login para acessar o sistema</CardDescription>
          </CardHeader>
          
          {connectionError && (
            <div className="px-6">
              <Alert variant="warning" className="bg-yellow-50 border-yellow-200 mb-4">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Aviso de Conectividade</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Não foi possível conectar ao servidor. O sistema continuará funcionando em modo local com capacidade limitada.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="Digite seu nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">Carregando...</span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          <p>Usuários disponíveis para teste:</p>
          <p><strong>Admin:</strong> admin / admin123</p>
          <p><strong>Funcionário:</strong> func1 / func123</p>
        </div>
        
        {connectionError && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <WifiOff size={14} />
              Modo offline ativo
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
