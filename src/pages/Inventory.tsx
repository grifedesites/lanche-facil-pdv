
import React, { useState } from "react";
import { format } from "date-fns";
import AppShell from "@/components/Layout/AppShell";
import { useProducts, Product, StockMovement, Supplier } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  PackageOpen,
  Warehouse,
  Truck,
  History,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Inventory: React.FC = () => {
  const { 
    products, 
    categories, 
    suppliers,
    updateProduct, 
    updateStock,
    checkLowStock,
    getStockMovements,
    addSupplier,
    updateSupplier,
    deleteSupplier
  } = useProducts();
  const { user } = useAuth();
  
  // Estados para filtros e tabs
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  
  // Estado para diálogos
  const [isStockAdjustDialog, setIsStockAdjustDialog] = useState(false);
  const [isStockHistoryDialog, setIsStockHistoryDialog] = useState(false);
  const [isSupplierDialog, setIsSupplierDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  
  // Estado para fornecedor
  const [supplierForm, setSupplierForm] = useState<{
    id?: string;
    name: string;
    phone: string;
    email: string;
  }>({
    name: "",
    phone: "",
    email: "",
  });
  
  // Filtragem de produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesLowStock = !showLowStock || 
                          (product.stock !== undefined && 
                           product.minStock !== undefined && 
                           product.stock <= product.minStock);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = checkLowStock().length;
  
  // Função para abrir diálogo de ajuste de estoque
  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentQuantity(0);
    setAdjustmentType("add");
    setAdjustmentReason("");
    setIsStockAdjustDialog(true);
  };
  
  // Função para abrir diálogo de histórico de estoque
  const handleViewStockHistory = (product: Product) => {
    setSelectedProduct(product);
    setIsStockHistoryDialog(true);
  };
  
  // Função para salvar ajuste de estoque
  const handleSaveStockAdjustment = () => {
    if (!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()) {
      toast.error("Por favor, preencha todos os campos!");
      return;
    }
    
    const quantityChange = adjustmentType === "add" ? adjustmentQuantity : -adjustmentQuantity;
    
    try {
      updateStock(selectedProduct.id, quantityChange, adjustmentReason);
      setIsStockAdjustDialog(false);
    } catch (error) {
      toast.error("Erro ao ajustar o estoque!");
    }
  };
  
  // Função para definir o estoque mínimo
  const handleSetMinStock = (product: Product, minStock: number) => {
    if (minStock < 0) return;
    
    updateProduct(product.id, { minStock });
    toast.success("Estoque mínimo atualizado!");
  };
  
  // Função para abrir diálogo de fornecedor
  const handleSupplierDialog = (supplier?: Supplier) => {
    if (supplier) {
      setSupplierForm({
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone || "",
        email: supplier.email || ""
      });
    } else {
      setSupplierForm({
        name: "",
        phone: "",
        email: ""
      });
    }
    
    setIsSupplierDialog(true);
  };
  
  // Função para salvar fornecedor
  const handleSaveSupplier = () => {
    if (!supplierForm.name) {
      toast.error("Nome do fornecedor é obrigatório!");
      return;
    }
    
    try {
      if (supplierForm.id) {
        updateSupplier(supplierForm.id, {
          name: supplierForm.name,
          phone: supplierForm.phone,
          email: supplierForm.email
        });
      } else {
        addSupplier({
          name: supplierForm.name,
          phone: supplierForm.phone,
          email: supplierForm.email
        });
      }
      
      setIsSupplierDialog(false);
      toast.success(`Fornecedor ${supplierForm.id ? "atualizado" : "adicionado"} com sucesso!`);
    } catch (error) {
      toast.error("Erro ao salvar fornecedor!");
    }
  };
  
  // Função para excluir fornecedor
  const handleDeleteSupplier = (id: string) => {
    try {
      deleteSupplier(id);
    } catch (error) {
      toast.error("Erro ao excluir fornecedor!");
    }
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Warehouse className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{lowStockCount} produtos com estoque baixo</span>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
          
          {/* Tab de Produtos */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventário de Produtos</CardTitle>
                <CardDescription>
                  Gerencie o estoque de todos os produtos cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select
                      value={selectedCategory || ""}
                      onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className={`${showLowStock ? 'bg-amber-100' : ''}`}
                      onClick={() => setShowLowStock(!showLowStock)}
                    >
                      <AlertTriangle className={`mr-2 h-4 w-4 ${showLowStock ? 'text-amber-500' : ''}`} />
                      Estoque Baixo
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Estoque Atual</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Nenhum produto encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => {
                          const isLowStock = product.stock !== undefined && 
                                          product.minStock !== undefined && 
                                          product.stock <= product.minStock;
                          
                          const supplier = suppliers.find(s => s.id === product.supplier);
                          
                          return (
                            <TableRow key={product.id} className={isLowStock ? 'bg-amber-50' : ''}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>
                                {categories.find(c => c.id === product.category)?.name || 'Sem categoria'}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={isLowStock ? 'text-amber-600 font-medium' : ''}>
                                  {product.stock !== undefined ? product.stock : 'N/D'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleSetMinStock(product, (product.minStock || 0) - 1)}
                                    disabled={!product.minStock || product.minStock <= 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span>{product.minStock !== undefined ? product.minStock : 'N/D'}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleSetMinStock(product, (product.minStock || 0) + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                {supplier?.name || 'Não especificado'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    onClick={() => handleAdjustStock(product)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <PackageOpen className="mr-2 h-4 w-4" />
                                    Ajustar
                                  </Button>
                                  <Button 
                                    onClick={() => handleViewStockHistory(product)}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <History className="mr-2 h-4 w-4" />
                                    Histórico
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab de Fornecedores */}
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fornecedores</CardTitle>
                <CardDescription>
                  Gerencie os fornecedores de produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="relative w-80">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar fornecedores..."
                      className="pl-8"
                    />
                  </div>
                  
                  <Button onClick={() => handleSupplierDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Fornecedor
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            Nenhum fornecedor cadastrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                {supplier.name}
                              </div>
                            </TableCell>
                            <TableCell>{supplier.phone || '-'}</TableCell>
                            <TableCell>{supplier.email || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  onClick={() => handleSupplierDialog(supplier)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Editar
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteSupplier(supplier.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab de Movimentações */}
          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações de Estoque</CardTitle>
                <CardDescription>
                  Histórico de todas as movimentações de estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStockMovements().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Nenhuma movimentação registrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        getStockMovements()
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((movement) => {
                            const product = products.find(p => p.id === movement.productId);
                            
                            return (
                              <TableRow key={movement.id}>
                                <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                <TableCell className="font-medium">{product?.name || 'Produto não encontrado'}</TableCell>
                                <TableCell>
                                  {movement.type === "in" && (
                                    <Badge className="bg-green-500">Entrada</Badge>
                                  )}
                                  {movement.type === "out" && (
                                    <Badge variant="destructive">Saída</Badge>
                                  )}
                                  {movement.type === "adjustment" && (
                                    <Badge variant="outline">Ajuste</Badge>
                                  )}
                                  {movement.type === "sale" && (
                                    <Badge variant="secondary">Venda</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className={cn(
                                    "flex items-center",
                                    movement.quantity > 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {movement.quantity > 0 ? (
                                      <TrendingUp className="mr-1 h-4 w-4" />
                                    ) : (
                                      <TrendingDown className="mr-1 h-4 w-4" />
                                    )}
                                    {Math.abs(movement.quantity)}
                                  </div>
                                </TableCell>
                                <TableCell>{movement.reason}</TableCell>
                              </TableRow>
                            );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para Ajuste de Estoque */}
      <Dialog open={isStockAdjustDialog} onOpenChange={setIsStockAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste de Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label>Estoque atual</Label>
              <div className="text-lg font-semibold">
                {selectedProduct?.stock !== undefined ? selectedProduct.stock : 'N/D'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={adjustmentType === "add" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAdjustmentType("add")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "remove" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAdjustmentType("remove")}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-quantity">Quantidade</Label>
              <Input
                id="adjustment-quantity"
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Motivo do ajuste</Label>
              <Input
                id="adjustment-reason"
                placeholder="Ex: Entrada de mercadoria, Perda, etc."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockAdjustDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStockAdjustment}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Histórico de Estoque */}
      <Dialog open={isStockHistoryDialog} onOpenChange={setIsStockHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Produto: ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProduct &&
                    getStockMovements(selectedProduct.id).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Nenhuma movimentação registrada para este produto.
                      </TableCell>
                    </TableRow>
                  ) : selectedProduct ? (
                    getStockMovements(selectedProduct.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            {movement.type === "in" && (
                              <Badge className="bg-green-500">Entrada</Badge>
                            )}
                            {movement.type === "out" && (
                              <Badge variant="destructive">Saída</Badge>
                            )}
                            {movement.type === "adjustment" && (
                              <Badge variant="outline">Ajuste</Badge>
                            )}
                            {movement.type === "sale" && (
                              <Badge variant="secondary">Venda</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "flex items-center",
                              movement.quantity > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {movement.quantity > 0 ? (
                                <TrendingUp className="mr-1 h-4 w-4" />
                              ) : (
                                <TrendingDown className="mr-1 h-4 w-4" />
                              )}
                              {Math.abs(movement.quantity)}
                            </div>
                          </TableCell>
                          <TableCell>{movement.reason}</TableCell>
                        </TableRow>
                      ))
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsStockHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Fornecedor */}
      <Dialog open={isSupplierDialog} onOpenChange={setIsSupplierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{supplierForm.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Nome*</Label>
              <Input
                id="supplier-name"
                placeholder="Nome do fornecedor"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Telefone</Label>
              <Input
                id="supplier-phone"
                placeholder="(00) 00000-0000"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                placeholder="email@exemplo.com"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupplierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSupplier}>
              {supplierForm.id ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Inventory;
