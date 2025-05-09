
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useProducts, Product } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { toast } from "sonner";
import { Search, Plus, Minus, AlertTriangle, PackageOpen } from "lucide-react";

const Inventory: React.FC = () => {
  const { products, categories, updateProduct, updateStock, checkLowStock } = useProducts();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  
  const [isStockAdjustDialog, setIsStockAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  
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
  
  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentQuantity(0);
    setAdjustmentType("add");
    setAdjustmentReason("");
    setIsStockAdjustDialog(true);
  };
  
  const handleSaveStockAdjustment = () => {
    if (!selectedProduct || adjustmentQuantity <= 0 || !adjustmentReason.trim()) {
      toast.error("Por favor, preencha todos os campos!");
      return;
    }
    
    const quantityChange = adjustmentType === "add" ? adjustmentQuantity : -adjustmentQuantity;
    
    try {
      updateStock(selectedProduct.id, quantityChange);
      toast.success(`Estoque ${adjustmentType === "add" ? "adicionado" : "removido"} com sucesso!`);
      setIsStockAdjustDialog(false);
    } catch (error) {
      toast.error("Erro ao ajustar o estoque!");
    }
  };
  
  const handleSetMinStock = (product: Product, minStock: number) => {
    if (minStock < 0) return;
    
    updateProduct(product.id, { minStock });
    toast.success("Estoque mínimo atualizado!");
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          
          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{lowStockCount} produtos com estoque baixo</span>
              </div>
            )}
          </div>
        </div>

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
                  onValueChange={(value) => setSelectedCategory(value || null)}
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLowStock = product.stock !== undefined && 
                                        product.minStock !== undefined && 
                                        product.stock <= product.minStock;
                      
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
                          <TableCell className="text-right">
                            <Button 
                              onClick={() => handleAdjustStock(product)}
                              variant="outline"
                              size="sm"
                            >
                              <PackageOpen className="mr-2 h-4 w-4" />
                              Ajustar
                            </Button>
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
    </AppShell>
  );
};

export default Inventory;
