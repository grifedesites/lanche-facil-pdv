
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { User, useAuth } from "@/contexts/AuthContext";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Eye, EyeOff, Plus, User as UserIcon } from "lucide-react";

// Usuários simulados
const MOCK_USERS: User[] = [
  { id: "1", name: "Administrador", username: "admin", role: "admin" },
  { id: "2", name: "Funcionário 1", username: "func1", role: "employee" },
  { id: "3", name: "Funcionário 2", username: "func2", role: "employee" },
];

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User & { password: string }>>({ role: "employee" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const handleAddUser = () => {
    setNewUser({ name: "", username: "", password: "", role: "employee" });
    setIsUserDialogOpen(true);
  };
  
  const handleSaveUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password || !newUser.role) {
      toast.error("Todos os campos são obrigatórios!");
      return;
    }
    
    if (users.some(u => u.username === newUser.username)) {
      toast.error("Este nome de usuário já está em uso!");
      return;
    }
    
    const createdUser: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role as "admin" | "employee",
    };
    
    setUsers([...users, createdUser]);
    setIsUserDialogOpen(false);
    toast.success(`Usuário ${newUser.name} criado com sucesso!`);
  };
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Usuários</h1>
          
          <Button onClick={handleAddUser}>
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" /> {user.name}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.role === "admin" ? "Administrador" : "Funcionário"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        {user.id === currentUser?.id ? "Você" : "Ativo"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <p>
              Nota: Este é um ambiente de demonstração. Na versão de produção, você poderia editar e excluir usuários.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Diálogo para adicionar usuário */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Nome Completo</Label>
              <Input
                id="user-name"
                value={newUser.name || ""}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={newUser.username || ""}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={newUser.password || ""}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={togglePasswordVisibility}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as "admin" | "employee" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Users;
