
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useProducts, Product, Category } from "@/contexts/ProductContext";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Edit, Trash, Plus, Search } from "lucide-react";

const ProductsManagement: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useProducts();

  // Estado para o formulário de produto
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estado para o formulário de categoria
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Estado para filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const resetProductForm = () => {
    setCurrentProduct(null);
    setIsEditing(false);
    setIsProductDialogOpen(false);
  };

  const resetCategoryForm = () => {
    setCurrentCategory(null);
    setIsEditingCategory(false);
    setIsCategoryDialogOpen(false);
  };

  const handleAddProduct = () => {
    setIsEditing(false);
    setCurrentProduct({ name: "", price: 0, category: categories[0]?.id || "" });
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct({ ...product });
    setIsProductDialogOpen(true);
  };

  const handleAddCategory = () => {
    setIsEditingCategory(false);
    setCurrentCategory({ name: "" });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setIsEditingCategory(true);
    setCurrentCategory({ ...category });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!currentProduct || !currentProduct.name || !currentProduct.price || !currentProduct.category) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (isEditing && currentProduct.id) {
      updateProduct(currentProduct.id, currentProduct);
    } else {
      addProduct(currentProduct as Omit<Product, "id">);
    }

    resetProductForm();
  };

  const handleSaveCategory = () => {
    if (!currentCategory || !currentCategory.name) {
      toast.error("Por favor, informe o nome da categoria.");
      return;
    }

    if (isEditingCategory && currentCategory.id) {
      updateCategory(currentCategory.id, currentCategory.name);
    } else {
      addCategory(currentCategory as Omit<Category, "id">);
    }

    resetCategoryForm();
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(productId);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    try {
      deleteCategory(categoryId);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  };

  // Filtragem de produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Produtos</h1>
        
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
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
                    <SelectItem value="">Todas categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddProduct}>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Descrição</TableHead>
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
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          {categories.find(c => c.id === product.category)?.name || 'Sem categoria'}
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {product.description || "Sem descrição"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Diálogo de Produto */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Editar Produto" : "Adicionar Produto"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete as informações do produto abaixo.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-name">Nome</Label>
                    <Input 
                      id="product-name" 
                      value={currentProduct?.name || ""} 
                      onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="product-price">Preço</Label>
                    <Input 
                      id="product-price" 
                      type="number" 
                      step="0.01" 
                      value={currentProduct?.price || ""} 
                      onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="product-category">Categoria</Label>
                    <Select 
                      value={currentProduct?.category || ""} 
                      onValueChange={value => setCurrentProduct({...currentProduct, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="product-description">Descrição (opcional)</Label>
                    <Input 
                      id="product-description" 
                      value={currentProduct?.description || ""} 
                      onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} 
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={resetProductForm}>Cancelar</Button>
                  <Button onClick={handleSaveProduct}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categorias de Produtos</h2>
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" /> Nova Categoria
              </Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        Nenhuma categoria cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Diálogo de Categoria */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isEditingCategory ? "Editar Categoria" : "Adicionar Categoria"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Nome</Label>
                    <Input 
                      id="category-name" 
                      value={currentCategory?.name || ""} 
                      onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})} 
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={resetCategoryForm}>Cancelar</Button>
                  <Button onClick={handleSaveCategory}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default ProductsManagement;
