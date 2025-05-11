import React, { useState, useEffect } from "react";
import AppShell from "@/components/Layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings: React.FC = () => {
  const [companyName, setCompanyName] = useState("Minha Lanchonete");
  const [address, setAddress] = useState("Rua Exemplo, 123");
  const [phone, setPhone] = useState("(11) 99999-9999");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [adminClosingPassword, setAdminClosingPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load settings from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setInitialLoading(true);
        
        // Load company settings
        const { data: companyData, error: companyError } = await supabase
          .from('settings')
          .select()
          .in('key', ['company_name', 'company_address', 'company_phone', 'enable_notifications', 'print_receipt', 'dark_mode', 'admin_closing_password']);
        
        if (companyError) throw companyError;
        
        if (companyData) {
          const settingsMap = companyData.reduce((acc: Record<string, string>, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          
          if (settingsMap.company_name) setCompanyName(settingsMap.company_name);
          if (settingsMap.company_address) setAddress(settingsMap.company_address);
          if (settingsMap.company_phone) setPhone(settingsMap.company_phone);
          if (settingsMap.enable_notifications) setEnableNotifications(settingsMap.enable_notifications === 'true');
          if (settingsMap.print_receipt) setPrintReceipt(settingsMap.print_receipt === 'true');
          if (settingsMap.dark_mode) setDarkMode(settingsMap.dark_mode === 'true');
          if (settingsMap.admin_closing_password) setAdminClosingPassword(settingsMap.admin_closing_password);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Prepare settings to save
      const settingsToUpsert = [
        { key: 'company_name', value: companyName, description: 'Nome da empresa' },
        { key: 'company_address', value: address, description: 'Endereço da empresa' },
        { key: 'company_phone', value: phone, description: 'Telefone da empresa' },
        { key: 'enable_notifications', value: enableNotifications.toString(), description: 'Ativar notificações' },
        { key: 'print_receipt', value: printReceipt.toString(), description: 'Imprimir recibo automaticamente' },
        { key: 'dark_mode', value: darkMode.toString(), description: 'Modo escuro' },
        { key: 'admin_closing_password', value: adminClosingPassword, description: 'Senha para fechamento de caixa' },
      ];
      
      // Upsert settings
      const { error } = await supabase
        .from('settings')
        .upsert(
          settingsToUpsert,
          { onConflict: 'key', ignoreDuplicates: false }
        );
      
      if (error) throw error;
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema PDV.
          </p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="receipts">Recibos</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Estabelecimento</CardTitle>
                <CardDescription>
                  Estas informações serão exibidas nos recibos e relatórios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Nome da Lanchonete</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notificações</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa alertas para pedidos novos e cancelamentos
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={enableNotifications}
                    onCheckedChange={setEnableNotifications}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Personalização</CardTitle>
                <CardDescription>
                  Ajuste a aparência do sistema PDV.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Altera a aparência para um tema escuro
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Impressão</CardTitle>
                <CardDescription>
                  Configure como os recibos serão impressos ou exibidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="print-receipt">Imprimir Recibo</Label>
                    <p className="text-sm text-muted-foreground">
                      Imprimir automaticamente após finalizar pedido
                    </p>
                  </div>
                  <Switch
                    id="print-receipt"
                    checked={printReceipt}
                    onCheckedChange={setPrintReceipt}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="footer-text">Texto de Rodapé</Label>
                  <Input
                    id="footer-text"
                    placeholder="Ex: Obrigado pela preferência!"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Defina senhas e permissões para operações sensíveis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="closing-password">Senha para Fechamento de Caixa</Label>
                  <Input
                    id="closing-password"
                    type="password"
                    value={adminClosingPassword}
                    onChange={(e) => setAdminClosingPassword(e.target.value)}
                    placeholder="Digite uma senha para fechamento de caixa"
                  />
                  <p className="text-sm text-muted-foreground">
                    Esta senha será solicitada ao fechar o caixa. Deixe em branco para desabilitar.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Settings;
